/**
 * ${NAME}
 * Created by ${USER} on ${DATE}.
 */

import { Map,Record,List } from "immutable"
import { BaseService, RegisterService, IServiceConstructor } from "epic-services/internal"
import {
	getHot, setDataOnHotDispose, acceptHot	
} from "epic-global"

const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:${NAME},
		hotInstance:${NAME}
	}
// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.UI)
export class ${NAME} extends BaseService {

	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new ${NAME}()
		
		return instanceContainer.instance
	}
	
	/**
	 * Service is dead
	 */
	private killed = false
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscribers:Function[] = []
	
	/**
	 * Service dependencies
	 *
	 * @returns {[DatabaseClientService]}
	 */
	dependencies(): IServiceConstructor[] {
		return [] //DatabaseClientService ?
	}
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
		
		assert(!instanceContainer.instance,`${NAME} can only be instantiated once`)
	}
	
	/**
	 * init service
	 */
	async init() {
		return super.init()
	}
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		
		// DB CHANGE LISTENER ?
		//addDatabaseChangeListener(AvailableRepo,this.onAvailableReposUpdated)
		
		// SUBSCRIBE
		//this.unsubscribers.push(
		//)
		
		return super.start()
	}
	
	/**
	 * Stop the service 
	 */
	stop():Promise<this> {
		this.kill()
		return super.stop()
	}
	
	/**
	 * Kill the service immediately
	 */
	kill() {
		this.killed = true
		this.unsubscribers.forEach(it => it && it())
	}
	
	
}



/**
 * Get the GithubMonitorService singleton
 *
 * @return {GithubSyncService}
 */
export const get${NAME} = getHot(module,'get${NAME}',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return ${NAME}.getInstance()
	}
})) as () => ${NAME}



// BIND TO PROVIDER
Container.bind(${NAME}).provider({get: get${NAME}})

export default get${NAME}

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
	get${NAME}
}))
acceptHot(module,log)

