import * as moment from 'moment'


import {JobHandler} from 'job/JobHandler'
import {GitHubClient, OnDataCallback} from 'shared/GitHubClient'
import {User,Repo,Milestone,Label,Issue,AvailableRepo,Comment} from 'shared/models'

import {Stores} from 'shared/services/DatabaseClientService'
import {getSettings} from 'shared/settings/Settings'
import {Benchmark} from 'shared/util/Benchmark'
import {JobExecutor} from 'job/JobDecorations'
import {JobType, IJob, IJobLogger} from 'shared/actions/jobs/JobTypes'
import {IJobExecutor} from "job/JobExecutors"
import JobProgressTracker from "job/JobProgressTracker"
import { getRepoActions, getIssueActions } from  "shared/actions/ActionFactoryProvider"
import { ISyncChanges } from "shared/actions/repo/RepoActionFactory"
import { RepoSyncManager } from "shared/github/GithubEventHandlers"



const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename)



@JobExecutor
export class RepoSyncExecutor implements IJobExecutor {


	static supportedTypes() {
		return [JobType.RepoSync]
	}
	
	private client:GitHubClient
	private availableRepo:AvailableRepo
	private repo:Repo
	private job:IJob
	private logger:IJobLogger
	private progressTracker:JobProgressTracker
	private syncChanges:ISyncChanges
	
	
	/**
	 * Trigger an issue reload
	 */
	async reloadIssues() {
		await getIssueActions().loadIssues()
	}
	
	
	
	/**
	 * if dryRun argument was passed as true,
	 * prohibits persistence, etc
	 */
	isDryRun = () => _.get(this.job,'args.dryRun',false) as boolean === true
		

	/**
	 * Init params
	 *
	 * @param repo
	 */
	@Benchmarker
	async initParams(repo) {
		assert(getSettings().token,'Can not sync when not authenticated')

		this.syncChanges = {
			repoId:repo.id,
			repoChanged: false,
			issueNumbersNew: [],
			issueNumbersChanged: []
		}
	}


	/**
	 * Synchronize all issues
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncAssignees(stores:Stores, repo:Repo,onDataCallback:OnDataCallback<User> = null) {
		if (await RepoSyncManager.get(repo).syncAssignees(stores,this.logger,this.progressTracker,onDataCallback,this.isDryRun()))
			this.syncChanges.repoChanged = true
		

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
		return RepoSyncManager.get(repo).syncIssues(stores,this.logger,this.progressTracker,this.syncChanges,onDataCallback,this.isDryRun())
	}

	/**
	 * Synchronize all labels
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncLabels(stores:Stores,repo,onDataCallback:OnDataCallback<Label> = null) {
		if (await RepoSyncManager.get(repo).syncLabels(stores,this.logger,this.progressTracker,onDataCallback,this.isDryRun()))
			this.syncChanges.repoChanged = true
			
			
		
	}

	/**
	 * Synchronize all milestones in the repository
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	@Benchmarker
	async syncMilestones(stores:Stores,repo,onDataCallback:OnDataCallback<Milestone> = null) {
		
		if (await RepoSyncManager.get(repo).syncMilestones(stores,this.logger,this.progressTracker,onDataCallback,this.isDryRun()))
			this.syncChanges.repoChanged = true
		
		
	}
	
	

	/**
	 * Synchronize all comments in the repository
	 *
	 * @param stores
	 * @param repo
	 * @param onDataCallback
	 */
	
	@Benchmarker
	async syncComments(stores:Stores,repo:Repo,onDataCallback:OnDataCallback<Comment> = null) {
		return await RepoSyncManager.get(repo).syncComments(stores,this.logger,this.progressTracker,onDataCallback,this.isDryRun())
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
			stores = Container.get(Stores),
			{availableRepo,repo} = this
		
		
		if (!getSettings().token) {
			this.logger.error("Can not sync, not authenticated")
			return
		}

		this.logger.info(`Starting repo sync job for ${repo.full_name}: ${job.id}`)
		
		try {

			// Grab the repo
			let {repoId} = availableRepo

			// Check the last updated activity
			await this.initParams(repo)

			// Load Labels, milestones and assignees first
			await Promise.all([
				this.syncLabels(stores,repo),
				this.syncMilestones(stores,repo),
				this.syncAssignees(stores,repo)
			])
			
			// Load the issues, eventually track progress
			log.debug('waiting for all promises - we sync comments later ;)')
			await this.syncIssues(stores,repo)

			
			// Now get the store state to check if updates are needed
			getRepoActions().onSyncChanges(this.syncChanges)
			
			
			log.info('Now syncing comments')
			await Promise.delay(1000)
			await this.syncComments(stores,repo)
			
			
			
		} catch (err) {
			log.error('failed to sync repo issues', err)
			throw err
		}
	}
}


if (module.hot) {
	module.hot.accept(() => log.info(`HMR update - job classes just re-register/2`))
}