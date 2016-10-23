import {JobHandler} from '../JobHandler'
import {GitHubClient, OnDataCallback} from '../../shared/GitHubClient'
import {User,Repo,Milestone,Label,Issue,AvailableRepo,Comment,ISyncChanges} from '../.'

import {Stores} from '../../shared/services/DatabaseClientService'
import {getSettings} from '../../shared/settings/Settings'
import {Benchmark} from '../../shared/util/Benchmark'
import {JobExecutor} from '../JobDecorations'
import { JobType, IJob, IJobLogger, JobStatus } from '../../shared/actions/jobs/JobTypes'
import {IJobExecutor} from "../JobExecutors"
import JobProgressTracker from "../JobProgressTracker"

import { RepoSyncManager } from "../../shared/github/GithubSyncHandlers"
import { getHot, setDataOnHotDispose, acceptHot } from "../../shared/util/HotUtils"


interface IRepoSyncPending {
	resolver:Promise.Resolver<any>
	started:boolean
}

const
	log = getLogger(__filename),
	Benchmarker = Benchmark(__filename),
	repoSyncMap = getHot(module,'repoSyncMap',{}) as {[repoId:number]:IRepoSyncPending}

setDataOnHotDispose(module,() => ({
	repoSyncMap
}))


/**
 * Check to see if a pending repo sync exists
 *
 * @param repoId
 */
export function isRepoSyncPending(repoId:number) {
	return !!repoSyncMap[repoId] && !repoSyncMap[repoId].started
}

@JobExecutor
export class RepoSyncExecutor implements IJobExecutor {
	
	/**
	 * Job types that the sync executor supports
	 */
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
	
	
	// /**
	//  * Trigger an issue reload
	//  */
	// async reloadIssues() {
	// 	await getIssueActions().loadIssues()
	// }
	//
	//
	
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
	execute(handler:JobHandler,logger:IJobLogger,progressTracker:JobProgressTracker,job:IJob):Promise<any> {
		
		this.logger = logger
		this.progressTracker = progressTracker
		
		if (!getSettings().token) {
			this.logger.error(`User is not authenticated, can not sync`)
			return Promise.reject(new Error(`You are not authenticated, can not sync`))
		}
		
		
		// Assign job & props
		if (job) {
			Object.assign(this,_.pick(job.args,'availableRepo','repo'),{job})
		}
		
		const
			{availableRepo,repo} = this,
			repoId = repo.id,
		
			// CHECK FOR PENDING SYNC
			pendingSync = repoSyncMap[repoId],
			pendingResolver = pendingSync && pendingSync.resolver,
			pendingPromise = pendingResolver && pendingResolver.promise
		
		
		if(availableRepo.deleted) {
			this.logger.warn(`Repo has been deleted`)
			return Promise.resolve()
		}
		
		// If there is a pending sync then cancel
		if (pendingSync && !pendingSync.started) {
			this.logger.warn(`There is already a pending sync, this job is canceled: ${repoId}`)
			handler.setStatus(JobStatus.Cancelled,new Error(`There is already a pending sync, this job is canceled`))
			return Promise.resolve()
		}
		
		const
			deferred = Promise.defer(),
			thisSync = {
				started: false,
				resolver: deferred
			}
			
			
			/**
		 * Sync function, executes serially
		 */
		const syncRepo = async () => {
			
			this.client = Container.get(GitHubClient)
			
			const
				stores = Container.get(Stores)
			
			this.logger.info(`Starting repo sync job for ${repo.full_name}: ${job.id}`)
			
			try {
				
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
				
				log.info('Now syncing comments')
				await this.syncComments(stores,repo)
				
				
				deferred.resolve()
			} catch (err) {
				log.error('failed to sync repo issues', err)
				//throw err
				deferred.reject(err)
			}
		}
		
		
		
		// SET OUR RESOLVER AS THE CURRENT ONE
		repoSyncMap[repoId] = thisSync
		
		if (pendingSync && pendingPromise.isResolved() && pendingPromise.isRejected()) {
			this.logger.info(`Already syncing ${repo.full_name} / will continue when it completes`)
			pendingPromise.then(() => {
				thisSync.started = true
				this.logger.info(`Previous sync completed, now we are syncing`)
				setTimeout(syncRepo,100)
			})
		} else {
			setTimeout(syncRepo,100)
		}
		
		return deferred
			.promise
			.finally(() => {
				if (thisSync === repoSyncMap[repoId]) {
					delete repoSyncMap[repoId]
				}
			})
	}
}

acceptHot(module,log)