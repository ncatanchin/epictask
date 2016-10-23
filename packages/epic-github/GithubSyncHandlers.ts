
import { getStores, Stores } from "shared/Stores"

import {Repo} from 'shared/models/Repo'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {Issue} from 'shared/models/Issue'
import {User} from 'shared/models/User'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Comment} from 'shared/models/Comment'
import {RepoEvent,IssuesEvent} from 'shared/models/GitHubEvents'
import {} from 'shared/models/GitHubEvents'

import * as moment from 'moment'
import { createClient, GitHubClient, OnDataCallback } from "shared/GitHubClient"
import { getIssueActions, getRepoActions } from  "shared/actions/ActionFactoryProvider"
import { checkUpdatedAndAssign } from "shared/util/ModelUtil"
import JobProgressTracker from "../../epic-job-server/JobProgressTracker"
import { chunkSave } from "shared/db/DatabaseUtil"
import { shallowEquals, cloneObject } from "shared/util"
import SyncStatus from 'shared/github/GithubSyncStatus'
import { ISyncChanges } from "shared/models/Repo"
import { OneAtATime } from "shared/util/Decorations"
import { isRepoSyncPending } from "../../epic-job-server/executors/RepoSyncExecutor"


const
	log = getLogger(__filename)


let
	pendingEventUpdate:Promise.Resolver<any>

function isAvailableRepo(o:any):o is AvailableRepo {
	return o.repoId || o.repo
}

/**
 * RepoSyncManager
 */
export class RepoSyncManager {
	
	/**
	 * Map of repo managers keyed by eye
	 */
	private static managers:{[repoId:number]:RepoSyncManager} = {}
	
	/**
	 * Get the manager for the provided repo
	 *
	 * @param availRepoOrRepo
	 * @returns {RepoSyncManager}
	 */
	static get(availRepoOrRepo:AvailableRepo|Repo) {
		const
			repo = (isAvailableRepo(availRepoOrRepo)) ? availRepoOrRepo.repo : availRepoOrRepo,
			{id} = repo
		
		if (!RepoSyncManager.managers[id])
			RepoSyncManager.managers[id] = new RepoSyncManager(repo)
		
		return RepoSyncManager.managers[id]
	}
	
	
	/**
	 * Create a new repo manager
	 *
	 * @param repo
	 */
	constructor(public repo:Repo) { }
	
	/**
	 * Triggers a repo sync if one is not pending
	 */
	triggerRepoSync() {
		if (!isRepoSyncPending(this.repo.id)) {
			getRepoActions().syncRepo(this.repo.id)
		}
	}
	

	
	/**
	 * Handle issue events
	 *
	 * - Notes
	 * -- Issues can be updated without a new event - so we check updatedAt as well as just id existence
	 * -- IF the issue has been updated vs what we have in the database then update it & sync the comments for it
	 *
	 * @param availRepo
	 * @param events
	 */
	handleIssuesEvents = async(availRepo:AvailableRepo, ...events:IssuesEvent[]) => {
		if (pendingEventUpdate)
			await pendingEventUpdate.promise
		
		// Create a new resolver
		const
			deferred = pendingEventUpdate = Promise.defer()
		
		
		try {
			log.debug(`Handling ${events.length} issue events`)
			
			const
				stores = getStores(),
				{ repo, repoId } = availRepo
			
			// ITERATE SERIALLY - MULTIPLE EVENTS COULD ARRIVE FOR A SINGLE ISSUE AND ONLY THE LATEST NEEDS TO BE PROCESSED
			await Promise.all(events.map(async(event) => {
				try {
					const
						{ issue:eventIssue } = event,
						eventAt = moment(event.created_at),
						issueUpdatedAt = moment(eventIssue.updated_at)
					
					log.debug(`Received event ${event.event} for issue #${eventIssue.number}: ${eventIssue.title}
						\tIssue Updated At: ${issueUpdatedAt.fromNow()}
						\tEvent Occurred @ ${eventAt.fromNow()}
					`)
					
					
					// ASSIGN THE REPO_ID
					event.repoId = repoId
					
					// NOW ADD THE EVENT IF ITS MISSING OR HAS CHANGED
					const
						existingEvent = await stores.issuesEvent.get(IssuesEvent.makeId(repoId,eventIssue.number,event.id))
					
					if (existingEvent) {
						//TODO: test to see if we can stop checking events
						log.debug(`Issue not changed / ${event.event} for issue ${repo.full_name}#${event.issue.number}: ${event.issue.title}`)
					} else {
						await stores.issuesEvent.save(event)
					}
				} catch (err) {
					log.error(`Failed to handle event: ${event.event}`, event, err)
				}
				
			}))
			
			
			
			
		} catch (err) {
			log.error(`Failed to resolve ${events.length} issue events`, err)
		} finally {
			deferred.resolve()
			pendingEventUpdate = null
		}
		
	}
	
	
	/**
	 * Handle all repo events - while we persist everything - only
	 * custom handlers exist for issue & comment events
	 *
	 * @param availRepo
	 * @param events
	 */
	handleRepoEvents = async(availRepo:AvailableRepo, ...events:RepoEvent<any>[]) => {
		if (pendingEventUpdate)
			await pendingEventUpdate.promise
		
		
		// Create a new resolver
		const
			deferred = pendingEventUpdate = Promise.defer()
		
		try {
			log.debug(`Handling ${events.length} issue events`)
			
			let
				shouldUpdateIssues = false,
				shouldUpdateComments = false
			
			const
				stores = getStores(),
				client = createClient(),
				{ repo, repoId } = availRepo
			
			// ITERATE SERIALLY - MULTIPLE EVENTS COULD ARRIVE FOR A SINGLE ISSUE AND ONLY THE LATEST NEEDS TO BE PROCESSED
			await Promise.mapSeries(events, async(event) => {
				
				const
					eventAt = moment(event.created_at)
				
				// ASSIGN THE REPO_ID
				event.repoId = repoId
				
				try {
					log.debug(`Received repo event ${event.type} for repo #${repo.full_name}
						\tEvent Occurred @ ${eventAt.fromNow()}
					`)
					
					switch (event.type) {
						case "IssueCommentEvent":
							log.debug(`Processing comment event, going to update/create`)
							shouldUpdateComments = true
							
							
							break
						
						case "IssuesEvent":
							log.debug(`Processing issues event, going to update/create`)
							shouldUpdateIssues = true
							
							break
						default:
							log.debug(`RepoEvent type (${event.type}) is a standard event currently`)
					}
					
					
					// NOW ADD THE EVENT IF ITS MISSING OR HAS CHANGED
					const
						existingEvent = await stores.repoEvent.get(RepoEvent.makeId(event))
					
					if (existingEvent) {
						// && !moment(existingEvent.created_at).isAfter(eventAt)
						//TODO: test to see if we can stop checking events
						log.debug(`RepoEvent not changed / ${event.type} for repo ${repo.full_name}`)
					} else {
						await stores.repoEvent.save(event)
					}
					
				} catch (err) {
					log.error(`Failed to handle repo event for ${repo.full_name}: ${event.type}`, event, err)
				}
			})
			
			
			log.debug(`Resolved ${events.length} issue events`)
		} catch (err) {
			log.error(`Failed to resolve ${events.length} issue events`, err)
		} finally {
			deferred.resolve()
			pendingEventUpdate = null
		}
	}
		
	/**
	 * Notify the UI that a comment was updated
	 *
	 * @param comments
	 */
	async checkReloadActivity(comments:Comment[]) {
		try {
			
			// Reload current issue if loaded
			getIssueActions().commentsChanged(...comments)
			
		} catch (err) {
			log.error(`Failed to update the state with changed comments`)
		}
	}
	
	/**
	 * Sync milestones
	 */
	syncMilestones = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Milestone> = null, isDryRun = false) => {
		
		const
			client = createClient(),
			{repo} = this,
			repoId = repo.id
		
		progressTracker && progressTracker.increment(2)
		
		const
			milestones = await client.repoMilestones(this.repo, {
				onDataCallback,
				params: {
					state: 'all'
				}
			})
		
		progressTracker && progressTracker.completed()
		if (isDryRun)
			return milestones
		
		log.info(`Got ${milestones.length} milestones`)
		
		// MARK REPO ID FIRST
		milestones.forEach(milestone => milestone.repoId = repoId)
		
		
		const
			currentMilestones =
				await stores.milestone.findByRepo(repoId),
			
			pendingMilestones = [],
			
			// FIND REMOVED MILESTONES
			removedMilestones = currentMilestones
				.filter(m1 => !milestones.find(m2 => m1.id === m2.id))
		
		// REMOVE OLD MILESTONES
		for (let milestone of removedMilestones) {
			await stores.milestone.remove(Milestone.makeId(milestone))
		}
		
		
		for (let milestone of milestones) {
			
			const
				current = currentMilestones.find(it => it.id === milestone.id)
			
			
			// IF NO UPDATE THEN RETURN
			milestone = !current ? milestone : checkUpdatedAndAssign(
				logger || log,
				milestone.id,
				milestone,
				current
			)
			
			if (!milestone)
				continue
			
			pendingMilestones.push(milestone)
		}
		
		await chunkSave(pendingMilestones, stores.milestone)
		
		progressTracker && progressTracker.completed()
		
		// UPDATE MILESTONES ON STATE
		getRepoActions().updateMilestones(repoId,...milestones)
		
		return pendingMilestones.length
		
	})
	
	
	/**
	 * Sync all issues for a repo
	 *
	 * @param stores
	 * @param repo
	 * @param logger
	 * @param progressTracker
	 * @param syncChanges
	 * @param onDataCallback
	 * @param isDryRun
	 * @returns {Issue[]}
	 */
	syncIssues = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, syncChanges:ISyncChanges = null, onDataCallback:OnDataCallback<Issue> = null, isDryRun = false) => {
		
		//this.progressTracker.increment(1)
		
		let
			pagesSet = false,
			issuesToUpdateOnState = []
		
		function pushIssuesToState() {
			if (!issuesToUpdateOnState.length)
				return
			
			log.debug(`Updating ${issuesToUpdateOnState.length} issues on state`)
			getIssueActions().reloadIssues(issuesToUpdateOnState)
			issuesToUpdateOnState = []
		}
		
		const
			client = createClient(),
			updatedIssues:Issue[] = [],
			issuesResourceUrl = `${this.repo.id}-issue-sync`,
			issuesSinceParams = SyncStatus.getSinceTimestampParams(issuesResourceUrl),
			{repo} = this
		
		// SAVE A PAGE OF ISSUES
		async function saveIssuesPage(issues:Issue[], pageNumber:number, totalPages:number) {
			
			const
				pending = []
			
			for (let issue of issues) {
				issue.repoId = repo.id
				const
					existing = await stores.issue.get(issue.id)
				
				
				// IF NO UPDATE THEN RETURN
				if (!(issue = checkUpdatedAndAssign(logger || log, issue.id, issue, existing)))
					continue
				
				if (syncChanges) {
					existing ?
						syncChanges.issueNumbersChanged.push(issue.number) :
						syncChanges.issueNumbersNew.push(issue.number)
				}
				
				pending.push(issue)
				
			}
			
			if (pending.length)
				await chunkSave(pending, stores.issue)
			
			updatedIssues.push(...pending)
			progressTracker && progressTracker.completed()
			SyncStatus.setMostRecentTimestamp(issuesResourceUrl, pending, 'updated_at', 'created_at')
			issuesToUpdateOnState.push(...pending)
			
			if (pageNumber && pageNumber % 5 === 0) {
				pushIssuesToState()
			}
				
			
		}
		
		/**
		 * Handle a page of issues
		 *
		 * @param pageNumber
		 * @param totalPages
		 * @param items
		 */
		async function handleIssuesPage(pageNumber:number, totalPages:number, items:Issue[]) {
			
			// Update Progress
			if (!pagesSet) {
				progressTracker && progressTracker.increment(totalPages)
				logger && logger.info(`Getting ${totalPages} issue pages`)
			}
			pagesSet = true
			
			
			// Now handle
			logger && logger.info(`Received issues, page ${pageNumber} of ${totalPages}`)
			if (isDryRun) {
				log.info(`In dry run, skipping save`)
				return
			}
			
			await saveIssuesPage(items, pageNumber, totalPages)
			
			if (onDataCallback)
				onDataCallback(pageNumber, totalPages, items)
			
			logger && logger.info(`Completed saving issues, page ${pageNumber} of ${totalPages}`)
			progressTracker && progressTracker.completed()
		}
		
		// START PAGING ISSUES
		const
			issues = await client.repoIssues(this.repo, {
				
				// PAGING & SINCE PARAMS
				onDataCallback: handleIssuesPage,
				params: assign(issuesSinceParams,{
					state: 'all',
					sort: 'updated',
					filter: 'all'
				})
			})
		
		pushIssuesToState()
		// await Promise.all(issueSavePromises)
		logger && logger.info(`Received & processed ${issues.length} issues, updating sync status timestamp`)
		
		
		
		return updatedIssues
	})
	
	/**
	 * Sync all comments for a repo
	 *
	 * @param stores
	 * @param repo
	 * @param logger
	 * @param progressTracker
	 * @param onDataCallback
	 * @param isDryRun
	 * @returns {number}
	 */
	syncComments = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Comment> = null, isDryRun = false) => {
		
		let
			pagesSet = false,
			pendingChanges:Comment[] = [],
			updatedComments:Comment[] = []
		
		/**
		 * Push pending changes to the state
		 */
		function pushPendingChanges() {
			getIssueActions().commentsChanged(...pendingChanges)
			pendingChanges = []
		}
		
		
		const
			client = createClient(),
			commentsResourceUrl = `${this.repo.id}-comment-syn`,
			commentsSinceParams = SyncStatus.getSinceTimestampParams(commentsResourceUrl),
			
			// SAVE PAGE OF COMMENTS
			saveCommentsPage = async(comments:Comment[], pageNumber:number, totalPages:number) => {
				
				
				//this.logger.info(`Received comments page ${pageNumber} or ${totalPages}`)
				const
					pending = []
				
				for (let comment of comments) {
					if (!comment.issue_url) {
						logger && logger.error(`Comment is missing issue url: ${comment.id}`)
						log.error(`Comment is missing issue url`, comment)
						continue
					}
					
					const
						existing:Comment = await stores.comment.get(comment.id)
					
					// IF NO UPDATE THEN RETURN
					if (!(comment = checkUpdatedAndAssign(logger || log, comment.id, comment, existing)))
						continue
					
					assign(comment, {
						repoId: this.repo.id,
						issueNumber: parseInt(comment.issue_url.split('/').pop(), 10),
						parentRefId: Comment.makeParentRefId(this.repo.id, comment.issueNumber)
					})
					
					pending.push(comment)
					
				}
				
				if (pending.length)
					await chunkSave(pending, stores.comment)
				
				// PERIODICALLY PUSH PENDING COMMENT CHANGES TO THE STATE
				pendingChanges.push(...pending)
				if (pageNumber % 10 === 0)
					pushPendingChanges()
								
				// KEEP TRACK OF ALL CHANGES
				updatedComments.push(...pending)
				
				SyncStatus.setMostRecentTimestamp(commentsResourceUrl, pending, 'updated_at', 'created_at')
				
			},
			comments = await client.repoComments(this.repo, {
				// On each data call back add a promise to the list
				onDataCallback: async (pageNumber:number, totalPages:number, items:Comment[]) => {
					
					if (!pagesSet) {
						log.info(`Getting ${totalPages} comment pages`)
						progressTracker && progressTracker.increment(totalPages)
					}
					
					pagesSet = true
					
					
					logger && logger.info(`Received comments, page ${pageNumber} of ${totalPages}`)
					
					if (isDryRun) {
						log.info(`In dry run, skipping save`)
						return
					}
					
					
					await saveCommentsPage(items, pageNumber, totalPages)
					if (onDataCallback)
						onDataCallback(pageNumber, totalPages, items)
					
					logger && logger.info(`Saved comments, page ${pageNumber} of ${totalPages}`)
					progressTracker && progressTracker.completed()
				},
				params: assign({ sort: 'updated' }, commentsSinceParams)
			})
		
		logger && logger.info(`Checked ${comments.length} and updated ${updatedComments.length} comments`)
		pushPendingChanges()
		return updatedComments
	})
	
	/**
	 * Sync assignees
	 *
	 * @param stores
	 * @param repo
	 * @param logger
	 * @param progressTracker
	 * @param onDataCallback
	 * @param isDryRun
	 * @returns {any}
	 */
	syncAssignees = OneAtATime({}, async(stores:Stores, logger = null, progressTracker = null, onDataCallback:OnDataCallback<User> = null, isDryRun = false) => {
		/*
		 if (!(repo.permissions.push || repo.permissions.admin)) {
		 log.debug(`Admin/Push access not granted for ${repo.full_name}, can not get collaborators`)
		 return
		 }
		 */
		
		progressTracker && progressTracker.increment(3)
		
		// GET ALL ASSIGNEES
		const
			client = createClient(),
			updatedUsers:User[] = [],
			users:User[] = await client.repoAssignees(this.repo, {
				onDataCallback
			})
		
		progressTracker && progressTracker.completed()
		
		if (isDryRun)
			return users
		
		// Iterate all attached users and make sure we
		// update the repoIds on the user object if
		// already exists
		const
			userRepo = stores.user,
			existingUserIds = await userRepo.findAll()
			
		await Promise.all(users.map(async (user) => {
			let
				existingUser = existingUserIds.includes(user.id) && (await userRepo.get(user.id))
			
			// UPDATE EXISTING USER
			if (existingUser) {
				
				
				existingUser.repoIds = existingUser.repoIds || []
				
				if (!existingUser.repoIds.includes(this.repo.id) || !shallowEquals(existingUser, user, 'login', 'name', 'avatar_url')) {
					
					const
						repoIds = _.uniq((existingUser.repoIds).concat(this.repo.id))
					
					user = cloneObject(existingUser, user, {
						repoIds
					})
					
					if (existingUser.$$docs && existingUser.$$docs)
						user.$$docs = cloneObject(existingUser.$$docs)
					
					
					updatedUsers.push(user)
					await userRepo.save(user)
					
				}
				
			}
			
			// ADD NEW USER
			else {
				user.repoIds = [ this.repo.id ]
				updatedUsers.push(user)
				await userRepo.save(user)
			}
			
			
			
			
		}))
		
		
		progressTracker.completed()
		
		log.info(`Total collabs for ${this.repo.full_name} is ${users.length}`)
		// await chunkSave(users, userRepo)
		// progressTracker && progressTracker.completed()
		log.info(`Updated ${users.length} for repo ${this.repo.full_name}`)
		
		getRepoActions().updateCollaborators(this.repo.id,...updatedUsers)
		
		return updatedUsers.length
		
		
	})
	
	/**
	 * Sync all the labels for a repo
	 */
	syncLabels = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Label> = null, isDryRun = false) => {
		
		progressTracker && progressTracker.increment(2)
		
		const
			{repo} = this,
			repoId = repo.id,
			client = createClient(),
			
			labels = await client.repoLabels(this.repo, {
				onDataCallback
			})
		
		progressTracker && progressTracker.completed()
		
		if (isDryRun)
			return labels
		
		
		// SET REPO ID
		labels.forEach(label => label.repoId = this.repo.id)
		
		const
			pendingLabels = [],
			
			// CURRENT LABELS
			currentLabels = await stores.label.findByRepo(repoId),
			
			// DETERMINE REMOVED LABELS
			removeLabels = currentLabels
				.filter(l1 => !labels.find(l2 => l1.url === l2.url))
		
		// REMOVE OLD ONES
		for (let label of removeLabels) {
				await stores.label.remove(Label.makeId(label))
		}
		
		// MAKE UPDATES
		for (let label of labels) {
			const
				current = await stores.label.get(Label.makeId(label))
			
			// IF NO UPDATE THEN RETURN
			label = !current ? label :
				checkUpdatedAndAssign(
					logger || log,
					label.url,
					label,
					current,
					'color',
					'url',
					'name'
				)
			
			if (!label)
				continue
			
			pendingLabels.push(label)
			
		}
		
		await chunkSave(pendingLabels, stores.label)
		progressTracker && progressTracker.completed()
		
		getRepoActions().updateLabels(repoId,...labels)
		return pendingLabels.length
	})
	
	
}

