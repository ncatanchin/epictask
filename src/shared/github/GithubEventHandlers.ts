
import {IssuesEvent} from 'shared/models/GitHubEvents'
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

const
	log = getLogger(__filename)


let
	pendingEventUpdate:Promise.Resolver<any>

/**
 * Update comments for a specific issue
 *
 * @param stores
 * @param client
 * @param repo
 * @param issue
 */
async function updateComments(stores:Stores,client:GitHubClient,repo:Repo,issue:Issue) {
	try {
		
		return await syncComments(stores,repo)
		//
		// /**
		//  * Save chunk
		//  */
		// async function saveChunk(pageNumber,totalPages,comments:Comment[]) {
		//
		// 	log.info(`Saving chunk ${pageNumber} of ${totalPages} with ${comments.length} comments`)
		//
		// 	// ASSIGN AND MAP REQUIRED VARS
		// 	comments.forEach(comment => assign(comment, {
		// 		repoId: repo.id,
		// 		issueNumber: parseInt(comment.issue_url.split('/').pop(), 10),
		// 		parentRefId: Comment.makeParentRefId(repo.id, issue.number)
		// 	}))
		//
		// 	// MAP IDS
		// 	const
		// 		commentIds = comments.map(comment => Comment.makeCommentId(comment)),
		// 		existingComments = await stores.comment.bulkGet(...commentIds)
		//
		// 	// ITERATE AND UPDATE
		// 	const
		// 		pending = []
		//
		// 	for (let comment of comments) {
		// 		const
		// 			existingComment = existingComments.find(it => it.id === comment.id)
		//
		// 		// IF NO UPDATE THEN RETURN
		// 		if (!(comment = checkUpdatedAndAssign(log, comment.id, comment, existingComment)))
		// 			continue
		//
		// 		pending.push(comment)
		//
		// 	}
		//
		// 	if (pending.length) {
		// 		log.info(`Updating issue comments (${pending.length} changes)`)
		// 		await chunkSave(pending, stores.comment)
		// 	}
		// }
		//
		// /**
		//  * Get all chunks and map to save promises
		//  */
		// const
		// 	promises:Promise<any>[] = [],
		//
		// // MAP ALL DATA CALLBACKS TO PROMISES
		// // TODO: Stop iterating when we see comments that are older then the prior issue timestamp
		// 	allComments = await client.issueComments(repo, issue, {
		// 		onDataCallback: (pageNumber:number,totalPages:number,comments:Comment[]) =>
		// 			promises.push(saveChunk(pageNumber,totalPages,comments))
		// 	})
		//
		// await Promise.all(promises)
		// log.info(`Updated all comments for issue`,issue,allComments)
		//
	} catch (err) {
		log.error(`Failed to update comments`,issue,repo,err)
	}
}

/**
 * Push update to store if required
 *
 * @param stores
 * @param client
 * @param availRepo
 * @param eventIssue
 */
async function updateIssue(stores:Stores,client:GitHubClient,availRepo:AvailableRepo,eventIssue:Issue) {
	let
		changed = false
	
	try {
		log.info(`Triggering issue sync`)
		changed = (await syncIssues(stores,availRepo.repo)).length > 0
		
		log.info(`Issues completed successfully - triggering comments sync`)
		try {
			await syncComments(stores, availRepo.repo)
			log.info(`Comment sync succeeded`)
		} catch (err) {
			log.error(`Comment sync failed after issue sync succeeded`,err)
		}
		
		
		
		// const
		// 	issueUpdatedAt = moment(eventIssue.updated_at),
		// 	{repoId,repo} = availRepo,
		// 	prefixedIssueId = makeIssueId(repoId,eventIssue.number),
		// 	issue = await stores.issue.get(prefixedIssueId)
		//
		//
		// if (!issue || issueUpdatedAt.isAfter(moment(issue.updated_at))) {
		// 	log.info(
		// 		!issue ?
		// 			`New issue received: ${prefixedIssueId}` :
		// 			`Issue Updated, ${prefixedIssueId}: ${prefixedIssueId}: ${issue.title}`,
		// 		event
		// 	)
		//
		// 	const
		// 		ghIssue = await client.issue(repo.full_name, eventIssue.number)
		//
		// 	assert(repoId && ghIssue, `Unable to find github issue: ${repo.full_name}/${eventIssue.number}`)
		//
		// 	// MERGE THE ISSUES, SAVE & NOTIFY
		// 	let
		// 		updatedIssue:Issue
		//
		//
		// 	if (updatedIssue = checkUpdatedAndAssign(log, ghIssue.id, ghIssue, issue)) {
		//
		//
		// 		updatedIssue.repoId = repoId
		// 		await stores.issue.save(updatedIssue)
		//
		// 		log.info(`Updated issue ${repo.full_name}#${updatedIssue.number} - now updating comments`)
		//
		// 		// COMMENTS
		// 		await updateComments(stores, client, repo, updatedIssue)
		//
		// 		log.info(`Pushing issue updates to UI`)
		//
		// 		changed = true
		//
		//
		// 	}
		// }
	} catch (err) {
		log.error(`Failed to update/create issue from event`,err,eventIssue)
	}
	
	return changed
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
export async function handleIssuesEvents(availRepo:AvailableRepo,...events:IssuesEvent[]) {
	if (pendingEventUpdate)
		await pendingEventUpdate.promise
	
	
	
	// Create a new resolver
	const deferred = pendingEventUpdate = Promise.defer()
	
	
	
	try {
		log.info(`Handling ${events.length} issue events`)
		
		let
			changedIssueNumbers:number[]
		
		const
			stores = getStores(),
			client = createClient(),
			{repo,repoId} = availRepo
		
		// ITERATE SERIALLY - MULTIPLE EVENTS COULD ARRIVE FOR A SINGLE ISSUE AND ONLY THE LATEST NEEDS TO BE PROCESSED
		changedIssueNumbers = await Promise.mapSeries(events,async (event) => {
			try {
				const
					{ issue:eventIssue } = event,
					eventAt = moment(event.created_at),
					issueUpdatedAt = moment(eventIssue.updated_at)
				
				log.info(`Received event ${event.event} for issue #${eventIssue.number}: ${eventIssue.title}
						\tIssue Updated At: ${issueUpdatedAt.fromNow()}
						\tEvent Occurred @ ${eventAt.fromNow()}
					`)
				
				
				// ASSIGN THE REPO_ID
				event.repoId = repoId
				
				
				// CHECK FOR ISSUE UPDATE - IF SO THEN UPDATE ISSUE && COMMENTS
				let issueChanged = await updateIssue(stores,client,availRepo,event.issue)
				
				// NOW ADD THE EVENT IF ITS MISSING OR HAS CHANGED
				const
					existingEvent = await stores.issuesEvent.get(IssuesEvent.makeId(event))
				
				if (existingEvent && !moment(existingEvent.created_at).isAfter(eventAt)) {
					//TODO: test to see if we can stop checking events
					log.info(`Issue not changed / ${event.event} for issue ${repo.full_name}#${event.issue.number}: ${event.issue.title}`)
				} else {
					const
						updatedEvent = assign(event,existingEvent,event,{repoId})
					
					await stores.issuesEvent.save(updatedEvent)
					
					// TODO: NOTIFY UI OF NEW EVENT
				}
				
				return issueChanged && event.issue.number
			} catch (err) {
				log.error(`Failed to handle event: ${event.event}`,event,err)
			}
			
			return null
		})
		
		changedIssueNumbers = _.uniq((changedIssueNumbers || []).filter(issueNumber => isNumber(issueNumber) && !isNil(issueNumber) && (issueNumber as any) !== false))
		log.info(`Resolved ${events.length} issue events, issue numbers ${changedIssueNumbers.join(', ')} were changed`)
		
		if (changedIssueNumbers.length) {
			getIssueActions().onSyncChanges({
				repoId,
				issueNumbersChanged: changedIssueNumbers
			})
		}
		
		
	} catch (err) {
		log.error(`Failed to resolve ${events.length} issue events`,err)
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
export async function handleRepoEvents(availRepo:AvailableRepo,...events:RepoEvent<any>[]) {
	if (pendingEventUpdate)
		await pendingEventUpdate.promise
	
	
	
	// Create a new resolver
	const deferred = pendingEventUpdate = Promise.defer()
	
	try {
		log.info(`Handling ${events.length} issue events`)
		
		const
			stores = getStores(),
			client = createClient(),
			{repo,repoId} = availRepo
		
		// ITERATE SERIALLY - MULTIPLE EVENTS COULD ARRIVE FOR A SINGLE ISSUE AND ONLY THE LATEST NEEDS TO BE PROCESSED
		await Promise.mapSeries(events,async (event) => {
			
			const
				eventAt = moment(event.created_at)
			
			// ASSIGN THE REPO_ID
			event.repoId = repoId
						
			try {
				log.info(`Received repo event ${event.type} for repo #${repo.full_name}
						\tEvent Occurred @ ${eventAt.fromNow()}
					`)
				
				switch (event.type) {
					case "IssueCommentEvent":
						log.info(`Processing comment event, going to update/create`)
						const
							commentPayload = event.payload as IIssueCommentEventPayload
						
						await updateComments(stores,client,availRepo.repo,commentPayload.issue)
						
						break
					
					case "IssuesEvent":
						log.info(`Processing issues event, going to update/create`)
						
						const
							issuePayload = event.payload as IIssuesEventPayload
						
						await updateIssue(stores,client,availRepo,issuePayload.issue)
						break
					default:
						log.info(`RepoEvent type (${event.type}) is a standard event currently`)
				}
				
				
				// NOW ADD THE EVENT IF ITS MISSING OR HAS CHANGED
				const
					existingEvent = await stores.repoEvent.get(RepoEvent.makeId(event))
				
				if (existingEvent && !moment(existingEvent.created_at).isAfter(eventAt)) {
					//TODO: test to see if we can stop checking events
					log.info(`RepoEvent not changed / ${event.type} for repo ${repo.full_name}`)
				} else {
					const
						updatedEvent = assign(event,existingEvent,event,{repoId})
					
					await stores.repoEvent.save(updatedEvent)
					
					// TODO: NOTIFY UI OF NEW EVENT
				}
			} catch (err) {
				log.error(`Failed to handle repo event for ${repo.full_name}: ${event.type}`,event,err)
			}
		})
		
		log.info(`Resolved ${events.length} issue events`)
	} catch (err) {
		log.error(`Failed to resolve ${events.length} issue events`,err)
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
export function checkReloadActivity(comments:Comment[]) {
	// Reload current issue if loaded
	getIssueActions().commentsChanged(...comments)
	
}

export async function syncMilestones(stores:Stores,repo,logger = null,progressTracker:JobProgressTracker = null, onDataCallback:OnDataCallback<Milestone> = null, isDryRun = false) {
	
	const
		client = createClient()
	
	progressTracker && progressTracker.increment(2)
	
	const
		milestones = await client.repoMilestones(repo,{
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
		milestone.repoId = repo.id
		const
			existing = await stores.milestone.get(milestone.id)
		
		
		// IF NO UPDATE THEN RETURN
		if (!(milestone = checkUpdatedAndAssign(logger || log,milestone.id,milestone,existing)))
			continue
		
		pending.push(milestone)
	}
	
	await chunkSave(pending,stores.milestone)
	
	progressTracker && progressTracker.completed()
	
	return pending.length
	
}


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
export async function syncIssues(stores:Stores,repo:Repo,logger = null, progressTracker:JobProgressTracker = null, syncChanges:ISyncChanges = null,onDataCallback:OnDataCallback<Issue> = null,isDryRun = false) {
	
	//this.progressTracker.increment(1)
	
	let
		pagesSet = false
	
	
	const
		client = createClient(),
		updatedIssues:Issue[] = [],
		issuesResourceUrl = `${repo.id}-issues`,
		issuesSinceParams =  SyncStatus.getSinceTimestampParams(issuesResourceUrl),
		issueSavePromises:Promise<any>[] = [],
		
		// Save a batch of images
		saveIssuesPage = async (issues:Issue[],pageNumber:number,totalPages:number) => {
			
			const
				pending = []
			
			for (let issue of issues) {
				issue.repoId = repo.id
				const
					existing = await stores.issue.get(issue.id)
				
				
				// IF NO UPDATE THEN RETURN
				if (!(issue = checkUpdatedAndAssign(logger || log,issue.id,issue,existing)))
					continue
				
				if (syncChanges) {
					existing ?
						syncChanges.issueNumbersChanged.push(issue.number) :
						syncChanges.issueNumbersNew.push(issue.number)
				}
				
				pending.push(issue)
				
			}
			
			if (pending.length)
				await chunkSave(pending,stores.issue)
			
			updatedIssues.push(...pending)
			progressTracker && progressTracker.completed()
		},
		
		// Get all issues
		issues = await client.repoIssues(repo,{
		
		// On each data call back add a promise to the list
		onDataCallback: (pageNumber:number,totalPages:number,items:Issue[]) => {
			
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
			
			
			issueSavePromises.push(saveIssuesPage(items,pageNumber,totalPages))
			if (onDataCallback)
				onDataCallback(pageNumber,totalPages,items)
		},
		params: assign({
			state: 'all',
			sort: 'updated',
			filter: 'all'
		},issuesSinceParams)
	})
	
	await Promise.all(issueSavePromises)
	logger && logger.info(`Received & processed ${issues.length} issues, updating sync status timestamp`)
	
	SyncStatus.setMostRecentTimestamp(issuesResourceUrl,updatedIssues,'updated_at','created_at')
	
	return updatedIssues
}

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
export async function syncComments(stores:Stores,repo:Repo,logger = null,progressTracker:JobProgressTracker = null,onDataCallback:OnDataCallback<Comment> = null, isDryRun = false) {
	
	let
		pagesSet = false,
		updatedComments:Comment[] = []
	
	const
		client = createClient(),
		commentsResourceUrl = `${repo.id}-comments`,
		commentsSinceParams =  SyncStatus.getSinceTimestampParams(commentsResourceUrl),
		commentSavePromises = [],
		
		// Save a batch of images
		saveCommentsPage = async (comments:Comment[],pageNumber:number,totalPages:number) => {
			
			
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
				if (!(comment = checkUpdatedAndAssign(logger || log,comment.id,comment,existing)))
					continue
				
				assign(comment,{
					repoId: repo.id,
					issueNumber:parseInt(comment.issue_url.split('/').pop(),10),
					parentRefId: Comment.makeParentRefId(repo.id,comment.issueNumber)
				})
				
				pending.push(comment)
				
			}
			
			if (pending.length)
				await chunkSave(pending,stores.comment)
			
			// Push updates to STATE
			checkReloadActivity(pending)
			
			updatedComments.push(...pending)
			progressTracker && progressTracker.completed()
		},
		comments = await client.repoComments(repo, {
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
			
			
			commentSavePromises.push(saveCommentsPage(items,pageNumber,totalPages))
			if (onDataCallback)
				onDataCallback(pageNumber,totalPages,items)
		},
		params: assign({sort: 'updated'}, commentsSinceParams)
	})
	
	logger && logger.info(`Received ${comments.length} comments since last sync`)
	
	if (isDryRun)
		return updatedComments
	
	log.info(`Saving ${comments.length} comments`)
	await Promise.all(commentSavePromises)
	log.info(`Saved`)
	
	logger && logger.info(`Saved ${comments.length} comments`)
	
	SyncStatus.setMostRecentTimestamp(commentsResourceUrl,updatedComments,'updated_at','created_at')
	
	return updatedComments
}

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
export async function syncAssignees(stores:Stores, repo:Repo,logger = null,progressTracker = null,onDataCallback:OnDataCallback<User> = null, isDryRun = false) {
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
		users:User[] = await client.repoAssignees(repo,{
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
		existingUserIds = await userRepo.findAll(),
		updatePromises = []
	
	users.forEach(user => {
		if (existingUserIds.includes(user.id)) {
			// Look for an existing user first
			updatePromises.push(userRepo.get(user.id)
				.then(existingUser => {
					if (user = checkUpdatedAndAssign(logger || log,user.id,user,existingUser,'login','name','avatar_url')) {
						//user = user.addRepoId ? user : new User(user)
						user.repoIds = _.uniq((user.repoIds || []).concat([repo.id]))
						updatedUsers.push(user)
						
					}
					
				}))
			
		}
	})
	
	await Promise.all(updatePromises)
	progressTracker.completed()
	
	log.info(`Total collabs for ${repo.full_name} is ${users.length}`)
	await chunkSave(users,userRepo)
	progressTracker && progressTracker.completed()
	log.info(`Updated ${users.length} for repo ${repo.full_name}`)
	
	return updatedUsers.length
	
	
}


export async function syncLabels(stores:Stores,repo:Repo,logger = null, progressTracker:JobProgressTracker = null,onDataCallback:OnDataCallback<Label> = null,isDryRun = false) {
	progressTracker && progressTracker.increment(2)
	const
		client = createClient(),
		labels = await client.repoLabels(repo,{
			onDataCallback
		})
	
	progressTracker && progressTracker.completed()
	
	if (isDryRun)
		return labels
	
	const
		pending = []
	
	for (let label of labels) {
		label.repoId = repo.id
		const
			existing = await stores.label.get(label.url)
		
		// IF NO UPDATE THEN RETURN
		if (!(label = checkUpdatedAndAssign(logger || log,label.url,label,existing,'color','url','name')))
			continue
		
		pending.push(label)
		
	}
	
	
	await chunkSave(pending,stores.label)
	progressTracker && progressTracker.completed()
	return pending.length
}