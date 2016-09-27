import {List,Map} from 'immutable'

import * as assert from 'assert'

import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {DatabaseClientService} from "shared/services/DatabaseClientService"

import { RepoKey } from "shared/Constants"
import { clientObserveState, getStateValue } from "shared/AppStoreClient"
import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { AvailableRepo } from "shared/models"

import SyncStatus from './GithubSyncStatus'
import { getGithubEventMonitor } from "shared/github/GithubEventMonitor"
import {IssuesEvent,RepoEvent} from 'shared/models/GitHubEvents'
import { RepoSyncManager } from "shared/github/GithubEventHandlers"



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
		log.info(`Received available repos`,availableRepos.map(availRepo => _.get(availRepo.repo,'full_name','no-name')).join(', '))
		
		const
			monitor = getGithubEventMonitor(),
			currentRepoIds = monitor.getMonitoredRepoIds()
		
		log.info(`Checking for removed repos`)
		currentRepoIds
			.filter(repoId => !availableRepos.find(availRepo => availRepo.id === repoId))
			.forEach(repoId => {
				log.info(`No longer monitoring repo ${repoId} - stopping monitor`)
				monitor.stopRepoMonitoring(repoId)
			})
			
		
		log.info(`Checking for new repos to monitor`)
		availableRepos
			.filter(availRepo => !currentRepoIds.includes(availRepo.id))
			.forEach(availRepo => {
				log.info(`Starting to monitor repo ${availRepo.repo.full_name}`)
				
				const
					repoResourceUrl = `repo-${availRepo.id}`,
					issuesResourceUrl = `issues-${availRepo.id}`
				
				monitor.addRepoListener({
					id: availRepo.id,
					fullName: availRepo.repo.full_name,
					repoLastETag: SyncStatus.getETag(repoResourceUrl),
					repoLastTimestamp: SyncStatus.getTimestamp(repoResourceUrl),
					issuesLastETag: SyncStatus.getETag(issuesResourceUrl),
					issuesLastTimestamp: SyncStatus.getTimestamp(issuesResourceUrl)
				},{
					allIssuesEventsReceived(eTag:string,...events:IssuesEvent[]) {
						RepoSyncManager.get(availRepo).handleIssuesEvents(availRepo,...events)
						
						SyncStatus.setETag(issuesResourceUrl,eTag)
						SyncStatus.setTimestamp(issuesResourceUrl,Date.now())
					},
					allRepoEventsReceived(eTag:string,...events:RepoEvent<any>[]) {
						RepoSyncManager.get(availRepo).handleRepoEvents(availRepo,...events)
						
						SyncStatus.setETag(repoResourceUrl,eTag)
						SyncStatus.setTimestamp(repoResourceUrl,Date.now())
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
		
		log.info(`Waiting for github sync status to load`)
		await SyncStatus.awaitLoaded()
		
		log.info(`Sync status loaded, subscribing for repo updates from state`)
		this.unsubscriber = await clientObserveState([ RepoKey, 'availableRepos' ], this.onAvailableReposUpdated)
		
		
		const
			availableRepos:AvailableRepo[] = await getStateValue(RepoKey,'availableRepos')
		
		
		log.info(`Starting Github event monitor with initial repos: `,availableRepos)
		this.onAvailableReposUpdated(availableRepos)
	
		
		
		// Watch for job updates
		log.info('Subscribe for state updates')
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

