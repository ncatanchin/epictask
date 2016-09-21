import {List,Map} from 'immutable'

import * as assert from 'assert'
import {IEnumEventRemover} from 'shared/util/EnumEventEmitter'
import {BaseService, RegisterService, IServiceConstructor} from "shared/services"
import {DatabaseClientService} from "shared/services/DatabaseClientService"

import { RepoKey } from "shared/Constants"
import { clientObserveState, getStateValue } from "shared/AppStoreClient"
import { getHot, setDataOnDispose, acceptHot } from "shared/util/HotUtils"
import { AvailableRepo } from "shared/models"

const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:GithubEventMonitorService,
		hotInstance:GithubEventMonitorService
	}


/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.JobServer)
export class GithubEventMonitorService extends BaseService {

	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new GithubEventMonitorService()
		
		return instanceContainer.instance
	}
	
	
	private killed = false
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscriber:Function
	
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	constructor() {
		super()
		
		assert(!instanceContainer.instance,`GithubSyncManager can only be instantiated once`)
	}
	
	/**
	 * Make sure we are monitoring the correct available repos
	 *
	 * @param newAvailableRepos
	 */
	private onAvailableReposUpdated = (newAvailableRepos:AvailableRepo[]) => {
		log.info(`Received available repos`,newAvailableRepos)
	}
	
	async init():Promise<any> {
		return super.init()
	}
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		
		if (!ProcessConfig.isType(ProcessType.Test)) {
			this.unsubscriber = await clientObserveState([ RepoKey, 'availableRepos' ], this.onAvailableReposUpdated)
			
			const
				availableRepos = await getStateValue(RepoKey,'availableRepos')
			
			this.onAvailableReposUpdated(availableRepos)
		} else {
			log.info(`Skipping state check in TEST mode`)
		}
		
		
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
 * @return {GithubEventMonitorService}
 */
export const getGithubEventMonitor = getHot(module,'getGithubEventMonitor',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return GithubEventMonitorService.getInstance()
	}
})) as () => GithubEventMonitorService



// BIND TO PROVIDER
Container.bind(GithubEventMonitorService).provider({get: getGithubEventMonitor})

export default getGithubEventMonitor

// HMR - SETUP
if (instanceContainer.instance) {
	// TODO: HMR / Do state update stuff here
	log.info(`Reloaded from HMR`)
}
setDataOnDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getGithubEventMonitor
}))
acceptHot(module,log)

