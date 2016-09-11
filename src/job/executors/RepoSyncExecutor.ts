import * as moment from 'moment'

import ActivityManagerService from 'shared/services/ActivityManagerService'

import {JobHandler} from 'job/JobHandler'
import {GitHubClient, OnDataCallback} from 'shared/GitHubClient'
import {User,Repo,Milestone,Label,Issue,AvailableRepo,Comment,ActivityType} from 'shared/models'

import Toaster from 'shared/Toaster'
import {Stores,chunkSave} from 'shared/services/DatabaseClientService'
import {getSettings} from 'shared/Settings'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'

import {JobType, IJob, IJobLogger} from 'shared/actions/jobs/JobTypes'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'

import {getStoreState} from 'shared/store/AppStore'
import {enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'
import {IJobExecutor} from "job/JobExecutors"
import JobProgressTracker from "job/JobProgressTracker"



const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)



@JobExecutor
export class RepoSyncExecutor implements IJobExecutor {


	static supportedTypes() {
		return [JobType.RepoSync]
	}
	
	private client:GitHubClient
	private lastSyncParams:any
	private availableRepo:AvailableRepo
	private repo:Repo
	private job:IJob
	private logger:IJobLogger
	private progressTracker:JobProgressTracker
	
	async reloadIssues() {
		// Reload issues first
		await Container.get(IssueActionFactory).loadIssueIds()
	}
	
	checkReloadActivity = async (comment:Comment) => {
		// Reload current issue if loaded
		const
			issue = await Container.get(IssueActionFactory).getSelectedIssue()
		
		if (
			!issue ||
			!comment ||
			comment.issueNumber !== issue.number ||
			comment.repoId !== issue.repoId
		)
			return
		
		const
			{repo} = this,
			issueActions = Container.get(IssueActionFactory)
		
		log.debug('Checking if current issue is in this repo, if so then reload',
			_.get(issue,'id'),'repoId = ',repo.id,'issue repo id =', _.get(issue,'repoId'))
		
		// If the issue is loaded and in this repo then reload its activity
		issueActions.loadActivityForIssue(issue.id)
		
	}
	
	/**
	 * if dryRun argument was passed as true,
	 * prohibits persistence, etc
	 */
	isDryRun = () => _.get(this.job,'args.dryRun',false) === true
		

	/**
	 * Init params
	 *
	 * @param activityManager
	 * @param repo
	 */
	@Benchmarker
	async initParams(activityManager,repo) {
		assert(getSettings().token,'Can not sync when not authenticated')


		const lastActivity = await activityManager.findLastActivity(ActivityType.RepoSync,repo.id)
		const lastSyncTimestamp = new Date(lastActivity ? lastActivity.timestamp : 0)
		const lastSyncTimestamp8601 = moment(lastSyncTimestamp.getTime()).format()
		this.lastSyncParams = {since: lastSyncTimestamp8601}

		if (lastActivity) {
			log.info(`Last repo sync for ${repo.full_name} was ${moment(lastActivity.timestamp).fromNow()}`)
		}
	}


	/**
	 * Synchronize all issues
	 *
	 * @param stores
	 * @param repo
	 */
	@Benchmarker
	async syncAssignees(stores:Stores, repo:Repo,onDataCallback:OnDataCallback<User> = null) {
		/*
		if (!(repo.permissions.push || repo.permissions.admin)) {
			log.debug(`Admin/Push access not granted for ${repo.full_name}, can not get collaborators`)
			return
		}
		*/
		
		this.progressTracker.increment(3)
		
		const users:User[] = await this.client.repoAssignees(repo,{
			onDataCallback
		})
		
		this.progressTracker.completed()
		
		if (this.isDryRun())
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
						if (existingUser) {
							assign(user,existingUser,_.cloneDeep(user))
						}
					}))

			}
		})

		await Promise.all(updatePromises)
		this.progressTracker.completed()
		users.forEach(user => user.addRepoId(repo.id))


		log.info(`Total collabs for ${repo.full_name} is ${users.length}`)
		await chunkSave(users,userRepo)
		this.progressTracker.completed()
		log.info(`Updated ${users.length} for repo ${repo.full_name}`)

		return users


	}

	/**
	 * Synchronize all issues
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncIssues(stores:Stores,repo:Repo,onDataCallback:OnDataCallback<Issue> = null) {
		
		this.progressTracker.increment(1)
		
		let pagesSet = false
		
		const
			issueSavePromises:Promise<any>[] = [],
			
			// Save a batch of images
			saveIssues = async (issues:Issue[],pageNumber:number,totalPages:number) => {
				for (let issue of issues) {
					issue.repoId = repo.id
					const existing = await stores.issue.get(issue.id)
					if (existing)
						assign(issue,existing,issue)
				}
				
				if (issues.length)
					await chunkSave(issues,stores.issue)
				
				this.progressTracker.completed()
			},
			
			// Get all issues
			issues = await this.client.repoIssues(repo,{
				
				// On each data call back add a promise to the list
				onDataCallback: (pageNumber:number,totalPages:number,items:Issue[]) => {
					
					// Update Progress
					if (!pagesSet) {
						this.progressTracker.increment((totalPages * 2))
						this.logger.info(`Getting ${totalPages} issue pages`)
					}
					pagesSet = true
					this.progressTracker.completed()
					
					// Now handle
					log.info(`Received issues, page ${pageNumber} of ${totalPages}`)
					if (this.isDryRun()) {
						log.info(`In dry run, skipping save`)
						return
					}
					
					
					issueSavePromises.push(saveIssues(items,pageNumber,totalPages))
					if (onDataCallback)
						onDataCallback(pageNumber,totalPages,items)
				},
				params: assign({
					state: 'all',
					sort: 'updated',
					filter: 'all'
				},this.lastSyncParams)
			})

		await Promise.all(issueSavePromises)
		this.logger.info(`Received & processed ${issues.length} issues`)

		return issues
	}

	/**
	 * Synchronize all labels
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncLabels(stores,repo,onDataCallback:OnDataCallback<Label> = null) {
		this.progressTracker.increment(2)
		const labels = await this.client.repoLabels(repo,{
			onDataCallback
		})
		
		this.progressTracker.completed()
		
		if (this.isDryRun())
			return labels
		
		for (let label of labels) {
			label.repoId = repo.id
			const existing = await stores.label.get(label.url)
			if (existing)
				assign(label,existing,label)
		}
		

		await chunkSave(labels,stores.label)
		this.progressTracker.completed()
		return labels
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncMilestones(stores,repo,onDataCallback:OnDataCallback<Milestone> = null) {
		
		this.progressTracker.increment(2)
		
		const milestones = await this.client.repoMilestones(repo,{
			onDataCallback,
			params: {
				state: 'all'
			}
		})
		
		this.progressTracker.completed()
		if (this.isDryRun())
			return milestones
		
		log.info(`Got ${milestones.length} milestones`)
		for (let milestone of milestones) {
			milestone.repoId = repo.id
			const existing = await stores.milestone.get(milestone.id)
			if (existing)
				assign(milestone,existing,milestone)
		}

		//log.debug(`Loaded milestones, time to persist`, milestones)
		await chunkSave(milestones,stores.milestone)
		
		this.progressTracker.completed()
		
		return milestones
	}

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	
	@Benchmarker
	async syncComments(stores,repo,onDataCallback:OnDataCallback<Comment> = null) {
		this.progressTracker.increment(1)
		
		let pagesSet = false
		const
			commentSavePromises = [],
			
			// Save a batch of images
			saveComments = async (comments:Comment[],pageNumber:number,totalPages:number) => {
				
				
				//this.logger.info(`Received comments page ${pageNumber} or ${totalPages}`)
				
				for (let comment of comments) {
					if (!comment.issue_url) {
						this.logger.error(`Comment is missing issue url: ${comment.id}`)
						log.error(`Comment is missing issue url`, comment)
						continue
					}
					
					const existing = await stores.milestone.get(comment.id)
					
					if (existing)
						assign(comment,existing,comment)
					
					assign(comment,{
						repoId: repo.id,
						issueNumber:parseInt(comment.issue_url.split('/').pop(),10),
						parentRefId: Comment.makeParentRefId(repo.id,comment.issueNumber)
					})
					
					await this.checkReloadActivity(comment)
					
				}
				
				if (comments.length)
					await chunkSave(comments,stores.comment)
				
				this.progressTracker.completed()
			},
			comments = await this.client.repoComments(repo, {
					// On each data call back add a promise to the list
					onDataCallback: (pageNumber:number,totalPages:number,items:Comment[]) => {
						if (!pagesSet) {
							log.info(`Getting ${totalPages} comment pages`)
							this.progressTracker.increment(totalPages * 2)
						}
						pagesSet = true
						this.progressTracker.completed()
						
						log.info(`Received comments, page ${pageNumber} of ${totalPages}`)
						if (this.isDryRun()) {
							log.info(`In dry run, skipping save`)
							return
						}
						
						
						commentSavePromises.push(saveComments(items,pageNumber,totalPages))
						if (onDataCallback)
							onDataCallback(pageNumber,totalPages,items)
					},
				params: assign({sort: 'updated'}, this.lastSyncParams)
			})
		
		this.logger.info(`Received ${comments.length} comments since last sync`)
		
		if (this.isDryRun())
			return comments
		
		log.info(`Saving ${comments.length} comments`)
		await Promise.all(commentSavePromises)
		this.logger.info(`Saved ${comments.length} comments`)
		
		return comments
	}

	
	
	/**
	 * Job executor
	 *
	 * @param handler
	 * @param logger
	 * @param progressTracker
	 * @param job
	 */
	@Benchmarker
	async execute(handler:JobHandler,logger:IJobLogger,progressTracker:JobProgressTracker,job:IJob) {
		this.logger = logger
		this.progressTracker = progressTracker
		
		if (!getSettings().token) {
			this.logger.error(`User is not authenticated, can not sync`)
			throw new Error(`You are not authenticated, can not sync`)
		}
		
		// Assign job & props
		if (job) {
			Object.assign(this,
				_.pick(job.args,'availableRepo','repo'),
				{job})
		}

		this.client = Container.get(GitHubClient)

		const
			activityManager = Container.get(ActivityManagerService),
			stores = Container.get(Stores),
			toaster = Container.get(Toaster),
			{availableRepo,repo} = this

		if (!getSettings().token) {
			log.info("Can not sync, not authenticated")
			return
		}

		log.debug(`Starting repo sync job: `, job.id)
		try {

			// Grab the repo
			let {repoId} = availableRepo

			// Check the last updated activity
			await this.initParams(activityManager,repo)

			// Load the issues, eventually track progress
			log.debug('waiting for all promises - we sync comments later ;)')
			await Promise.all([
				this.syncIssues(stores,repo),
				this.syncLabels(stores,repo),
				this.syncMilestones(stores,repo),
				this.syncAssignees(stores,repo)
			])

			// Track the execution for timing/update purposes
			// As well as throttling management
			const repoSyncActivity = await activityManager.createActivity(ActivityType.RepoSync,repoId)
			this.logger.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)
			//log.info(`Creating repo sync activity ${repo.full_name}: ${repoSyncActivity.id} with timestamp ${new Date(repoSyncActivity.timestamp)}`)

			// Now get the store state to check if updates are needed


			// If the current repo is not enabled then return
			const enabledRepoIds = enabledRepoIdsSelector(getStoreState())
			
			if (enabledRepoIds.includes(repo.id)) {
				// TODO: Work this out
				await this.reloadIssues()
			}
			
			log.info('Now syncing comments')
			await Promise.delay(1000)
			await this.syncComments(stores,repo)

			

		} catch (err) {
			log.error('failed to sync repo issues', err)
			toaster.addErrorMessage(err)
		}
	}
}


if (module.hot) {
	module.hot.accept(() => log.info(`HMR update - job classes just re-register/2`))
}