import {List,Map} from 'immutable'



import {BaseService, RegisterService, IServiceConstructor} from "epic-services/internal"
import {DatabaseClientService} from "epic-services/DatabaseClientService"

import { RepoKey } from "epic-global"
import { clientObserveState, getStateValue } from "epic-typedux/store/AppStoreClient"
import { getHot, setDataOnHotDispose, acceptHot } from  "epic-global/HotUtils"
import { AvailableRepo, LoadStatus } from "epic-models"

import {getGithubEventMonitor} from './GithubEventMonitor'
import {RepoSyncManager} from './GithubSyncHandlers'
import {GithubSyncStatus as SyncStatus} from "epic-global/GithubSyncStatus"
import {IssuesEvent,RepoEvent} from 'epic-models'




const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:GithubEventService,
		hotInstance:GithubEventService
	}


/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.JobServer)
export class GithubEventService extends BaseService {

	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new GithubEventService()
		
		return instanceContainer.instance
	}
	
	
	private killed = false
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	/**
	 * Service dependencies
	 *
	 * @returns {[DatabaseClientService]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
		
		assert(!instanceContainer.instance,`GithubSyncManager can only be instantiated once`)
	}
	
	
	/**
	 * Make sure we are monitoring the correct available repos
	 *
	 * @param availableRepos
	 */
	private onAvailableReposUpdated = (availableRepos:AvailableRepo[]) => {
		const
			loadedAvailableRepos = !availableRepos ? [] : availableRepos
				.filter(it => it.repoLoadStatus === LoadStatus.Loaded)
		
		log.debug(`Received available repos`,loadedAvailableRepos.map(availRepo => _.get(availRepo.repo,'full_name','no-name')).join(', '))
		
		
		
		const
			monitor = getGithubEventMonitor(),
			currentRepoIds = monitor.getMonitoredRepoIds()
		
		log.info(`Checking for removed repos`)
		currentRepoIds
			.filter(repoId => !loadedAvailableRepos.find(availRepo => availRepo.id === repoId))
			.forEach(repoId => {
				log.debug(`No longer monitoring repo ${repoId} - stopping monitor`)
				monitor.stopRepoMonitoring(repoId)
			})
		
		
		
		log.info(`Checking for new repos to monitor`)
		loadedAvailableRepos
			.filter(availRepo => !currentRepoIds.includes(availRepo.id))
			.forEach(availRepo => {
				log.info(`Starting to monitor repo ${availRepo.repo.full_name}`)
				
				const
					repoResourceUrl = `${availRepo.id}-repo`,
					issuesResourceUrl = `${availRepo.id}-issues`
				
				let
					isFirstIssuesSync = !SyncStatus.getTimestamp(issuesResourceUrl),
					isFirstRepoSync = !SyncStatus.getTimestamp(repoResourceUrl)
				
				monitor.addRepoListener({
					id: availRepo.id,
					fullName: availRepo.repo.full_name,
					repoLastETag: SyncStatus.getETag(repoResourceUrl),
					repoLastTimestamp: SyncStatus.getTimestamp(repoResourceUrl),
					issuesLastETag: SyncStatus.getETag(issuesResourceUrl),
					issuesLastTimestamp: SyncStatus.getTimestamp(issuesResourceUrl)
				},{
					
					/**
					 * Repo event page notification
					 *
					 * @param eTag
					 * @param events
					 */
					repoEventsReceived: async (eTag:string,...events:RepoEvent<any>[]) => {
						await RepoSyncManager.get(availRepo).handleRepoEvents(availRepo,...events)
						if (isFirstRepoSync) {
							SyncStatus.setETag(repoResourceUrl, eTag)
							SyncStatus.setMostRecentTimestamp(repoResourceUrl, events, 'created_at')
						}
						
					},
					
					/**
					 * Repo event sync - after all completed
					 *
					 * @param eTag
					 * @param events
					 */
					allRepoEventsReceived: async (eTag:string,...events:RepoEvent<any>[]) => {
						isFirstRepoSync = false
						SyncStatus.setETag(repoResourceUrl,eTag)
						SyncStatus.setMostRecentTimestamp(repoResourceUrl, events, 'created_at')
						
						// TRIGGER SYNC - IF EVENTS RECEIVED
						if (events.length) {
							RepoSyncManager.get(availRepo).triggerRepoSync()
						}
					},
					
					/**
					 * IssuesEvent sync - page notification
					 * @param eTag
					 * @param events
					 */
					issuesEventsReceived: async (eTag:string,...events:IssuesEvent[]) => {
						await RepoSyncManager.get(availRepo).handleIssuesEvents(availRepo,...events)
						if (isFirstIssuesSync) {
							SyncStatus.setETag(issuesResourceUrl,eTag)
							SyncStatus.setMostRecentTimestamp(issuesResourceUrl, events, 'created_at')
						}
						
					},
					
					/**
					 * After all completed
					 *
					 * @param eTag
					 * @param events
					 */
					allIssuesEventsReceived: async (eTag:string,...events:IssuesEvent[]) => {
						isFirstIssuesSync = false
						
						
						
						SyncStatus.setETag(issuesResourceUrl,eTag)
						SyncStatus.setMostRecentTimestamp(issuesResourceUrl, events, 'created_at')
						
						// TRIGGER SYNC - IF EVENTS RECEIVED
						if (events.length) {
							RepoSyncManager.get(availRepo).triggerRepoSync()
						}
					}
					
				})
			})
	}
	
	
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		
		log.debug(`Waiting for github sync status to load`)
		await SyncStatus.awaitLoaded()
		
		log.debug(`Sync status loaded, subscribing for repo updates from state`)
		this.unsubscriber = await clientObserveState([ RepoKey, 'availableRepos' ], this.onAvailableReposUpdated)
		
		
		const
			availableRepos:AvailableRepo[] = await getStateValue(RepoKey,'availableRepos')
		
		
		log.info(`Starting Github event monitor with initial repos: `,availableRepos)
		this.onAvailableReposUpdated(availableRepos)
	
		
		
		// Watch for job updates
		log.debug('Subscribe for state updates')
		return super.start()
	}
	
	
	stop():Promise<this> {
		this.kill()
		
		return super.stop()
	}
	
	kill() {
		//assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		
		if (this.unsubscriber)
			this.unsubscriber()

	}
	
	
}



/**
 * Get the GithubEventMonitorService singleton
 *
 * @return {GithubEventService}
 */
export const getGithubEventService = getHot(module,'getGithubEventService',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return GithubEventService.getInstance()
	}
})) as () => GithubEventService



// BIND TO PROVIDER
Container.bind(GithubEventService).provider({get: getGithubEventService})

export default getGithubEventService

// HMR - SETUP
if (instanceContainer.instance) {
	// TODO: HMR / Do state update stuff here
	log.info(`Reloaded from HMR`)
}
setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getGithubEventService
}))
acceptHot(module,log)

