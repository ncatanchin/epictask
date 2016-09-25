import { IssuesEvent } from 'shared/models/GitHubEvents'
import { getStores, Stores } from "shared/Stores"
import {
	makeIssueId, applyIssueUpdate, Comment, AvailableRepo, Repo, Issue, RepoEvent,
	IIssuesEventPayload, IIssueCommentEventPayload, Milestone, User, Label
} from "shared/models"
import * as moment from 'moment'
import { createClient, GitHubClient, OnDataCallback } from "shared/GitHubClient"
import { getIssueActions } from "shared/actions/ActionFactoryProvider"
import { checkUpdatedAndAssign } from "shared/util/ModelUtil"
import JobProgressTracker from "job/JobProgressTracker"
import { chunkSave } from "shared/db/DatabaseUtil"
import { isNil, isNumber, shallowEquals, cloneObject } from "shared/util/ObjectUtil"
import SyncStatus from 'shared/github/GithubSyncStatus'
import { ISyncChanges } from "shared/actions/repo/RepoActionFactory"
import { OneAtATime } from "shared/util/Decorations"

const
	log = getLogger(__filename)


let
	pendingEventUpdate:Promise.Resolver<any>

function isAvailableRepo(o:any):o is AvailableRepo {
	return o.repoId || o.repo
}

export class RepoSyncManager {
	
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
			{id} = repo,
			{managers} = RepoSyncManager
		
		if (!managers[id])
			managers[id] = new RepoSyncManager(repo)
		
		return managers[id]
	}
	
	
	constructor(public repo:Repo) {
		
	}
	
	/**
	 * Update comments for a specific issue
	 *
	 * @param stores
	 * @param client
	 * @param repo
	 * @param issue
	 */
	
	updateComments = _.debounce(async(stores:Stores, client:GitHubClient) => {
		try {
			
			await this.syncComments(stores)
			
		} catch (err) {
			log.error(`Failed to update comments`, this.repo, err)
		}
	}, 500)
	
	/**
	 * Push update to store if required
	 *
	 * @param stores
	 * @param client
	 * @param availRepo
	 * @param eventIssue
	 */
	updateIssues = _.debounce(async(stores:Stores, client:GitHubClient) => {
		try {
			log.debug(`Triggering issue sync`)
			
			await this.syncIssues(stores).then(() => this.syncComments(stores))
			
			log.debug(`Issues completed successfully`)
			
		} catch (err) {
			log.error(`Failed to update/create issue from event`, err)
		}
		
	}, 500)
	
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
			
			// NOW ISSUE SYNC
			const
				updatedIssues = await this.syncIssues.override({waitForResult:true})(stores),
				issueNumbersChanged = updatedIssues.map(issue => issue.number)
			
			log.debug(`Resolved ${events.length} issue events, issue numbers ${issueNumbersChanged.join(', ')} were changed`)
			
			if (updatedIssues.length) {
				getIssueActions().onSyncChanges({
					repoId,
					issueNumbersChanged
				})
			}
			
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
			
			if (shouldUpdateIssues) {
				this.updateIssues(stores, client)
			} else if (shouldUpdateComments) {
				this.updateComments(stores, client)
			}
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
	checkReloadActivity(comments:Comment[]) {
		// Reload current issue if loaded
		getIssueActions().commentsChanged(...comments)
		
	}
	
	syncMilestones = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Milestone> = null, isDryRun = false) => {
		
		const
			client = createClient()
		
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
		
		const
			pending = []
		
		for (let milestone of milestones) {
			milestone.repoId = this.repo.id
			const
				existing = await stores.milestone.get(milestone.id)
			
			
			// IF NO UPDATE THEN RETURN
			if (!(milestone = checkUpdatedAndAssign(logger || log, milestone.id, milestone, existing)))
				continue
			
			pending.push(milestone)
		}
		
		await chunkSave(pending, stores.milestone)
		
		progressTracker && progressTracker.completed()
		
		return pending.length
		
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
			pagesSet = false
		
		
		const
			client = createClient(),
			updatedIssues:Issue[] = [],
			issuesResourceUrl = `${this.repo.id}-issues`,
			issuesSinceParams = SyncStatus.getSinceTimestampParams(issuesResourceUrl),
			issueSavePromises:Promise<any>[] = [],
			
			// Save a batch of images
			saveIssuesPage = async(issues:Issue[], pageNumber:number, totalPages:number) => {
				
				const
					pending = []
				
				for (let issue of issues) {
					issue.repoId = this.repo.id
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
			},
			
			// Get all issues
			issues = await client.repoIssues(this.repo, {
				
				// On each data call back add a promise to the list
				onDataCallback: (pageNumber:number, totalPages:number, items:Issue[]) => {
					
					// Update Progress
					if (!pagesSet) {
						progressTracker && progressTracker.increment((totalPages * 2))
						logger && logger.info(`Getting ${totalPages} issue pages`)
					}
					pagesSet = true
					progressTracker && progressTracker.completed()
					
					// Now handle
					logger && logger.info(`Received issues, page ${pageNumber} of ${totalPages}`)
					if (isDryRun) {
						log.info(`In dry run, skipping save`)
						return
					}
					
					
					issueSavePromises.push(saveIssuesPage(items, pageNumber, totalPages))
					if (onDataCallback)
						onDataCallback(pageNumber, totalPages, items)
				},
				params: assign({
					state: 'all',
					sort: 'updated',
					filter: 'all'
				}, issuesSinceParams)
			})
		
		await Promise.all(issueSavePromises)
		logger && logger.info(`Received & processed ${issues.length} issues, updating sync status timestamp`)
		
		SyncStatus.setMostRecentTimestamp(issuesResourceUrl, updatedIssues, 'updated_at', 'created_at')
		
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
			updatedComments:Comment[] = []
		
		const
			client = createClient(),
			commentsResourceUrl = `${this.repo.id}-comments`,
			commentsSinceParams = SyncStatus.getSinceTimestampParams(commentsResourceUrl),
			commentSavePromises = [],
			
			// Save a batch of images
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
				
				// Push updates to STATE
				this.checkReloadActivity(pending)
				
				updatedComments.push(...pending)
				progressTracker && progressTracker.completed()
			},
			comments = await client.repoComments(this.repo, {
				// On each data call back add a promise to the list
				onDataCallback: (pageNumber:number, totalPages:number, items:Comment[]) => {
					
					if (!pagesSet) {
						log.info(`Getting ${totalPages} comment pages`)
						progressTracker && progressTracker.increment(totalPages * 2)
					}
					
					pagesSet = true
					progressTracker && progressTracker.completed()
					
					log.info(`Received comments, page ${pageNumber} of ${totalPages}`)
					if (isDryRun) {
						log.info(`In dry run, skipping save`)
						return
					}
					
					
					commentSavePromises.push(saveCommentsPage(items, pageNumber, totalPages))
					if (onDataCallback)
						onDataCallback(pageNumber, totalPages, items)
				},
				params: assign({ sort: 'updated' }, commentsSinceParams)
			})
		
		logger && logger.info(`Received ${comments.length} comments since last sync`)
		
		if (isDryRun)
			return updatedComments
		
		log.info(`Saving ${comments.length} comments`)
		await Promise.all(commentSavePromises)
		log.info(`Saved`)
		
		logger && logger.info(`Saved ${comments.length} comments`)
		
		SyncStatus.setMostRecentTimestamp(commentsResourceUrl, updatedComments, 'updated_at', 'created_at')
		
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
					
				}
				
			}
			
			// ADD NEW USER
			else {
				user.repoIds = [ this.repo.id ]
			}
			
			await userRepo.save(user)
			
			updatedUsers.push(user)
		}))
		
		
		progressTracker.completed()
		
		log.info(`Total collabs for ${this.repo.full_name} is ${users.length}`)
		// await chunkSave(users, userRepo)
		// progressTracker && progressTracker.completed()
		log.info(`Updated ${users.length} for repo ${this.repo.full_name}`)
		
		return updatedUsers.length
		
		
	})
	
	
	syncLabels = OneAtATime({}, async(stores:Stores, logger = null, progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Label> = null, isDryRun = false) => {
		progressTracker && progressTracker.increment(2)
		const
			client = createClient(),
			labels = await client.repoLabels(this.repo, {
				onDataCallback
			})
		
		progressTracker && progressTracker.completed()
		
		if (isDryRun)
			return labels
		
		const
			pending = []
		
		for (let label of labels) {
			label.repoId = this.repo.id
			const
				existing = await stores.label.get(label.url)
			
			// IF NO UPDATE THEN RETURN
			if (!(label = checkUpdatedAndAssign(logger || log, label.url, label, existing, 'color', 'url', 'name')))
				continue
			
			pending.push(label)
			
		}
		
		
		await chunkSave(pending, stores.label)
		progressTracker && progressTracker.completed()
		return pending.length
	})
	
	
}

