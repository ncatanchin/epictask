/**
 * SoundFXService
 * Created by jglanz on 12/31/16.
 */
import 'howler'
import { Map, Record, List } from "immutable"
import { BaseService, RegisterService } from "epic-services/internal"

import {
	getHot, setDataOnHotDispose, acceptHot
} from "epic-global"

const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module, 'instanceContainer', {}) as {
		instance:SoundFXService,
		hotInstance:SoundFXService
	}
// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

// Available Sounds
export const
	SoundsGlobal = {
		Ding: {
			src: [require('!!file-loader!assets/sounds/ding.webm')],
			volume: 0.6,
			
			// MIN INTERVAL 10 MINS
			minInterval: 10 * (60 * 1000),
			
			lastTimestamp: 0
		}
	}

function PlaySound(key:TSoundKey) {
	const
		soundConfig = Sounds[key],
		{minInterval,lastTimestamp} = soundConfig
	
	if (minInterval && Date.now() - lastTimestamp < minInterval) {
		return log.debug(`played sound ${key} to recently`)
	}
	
	const
		sound = new Howl(soundConfig)
	
	sound.play()
	
	soundConfig.lastTimestamp = Date.now()
}

// Global Declaration
declare global {
	// Types
	type TSounds = typeof SoundsGlobal
	type TSoundKey = keyof TSounds
	
	let Sounds:TSounds
	
	function PlaySound(key:TSoundKey):boolean
}


assignGlobal({
	Sounds:SoundsGlobal,
	PlaySound
})


/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.UI)
export class SoundFXService extends BaseService {
	
	static readonly ServiceName = "SoundFXService"
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new SoundFXService()
		
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
	dependencies():IServiceConstructor[] {
		return [] //DatabaseClientService ?
	}
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
		
		assert(!instanceContainer.instance, `SoundFXService can only be instantiated once`)
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
export const getSoundFXService = getHot(module, 'getSoundFXService', new Proxy(function () {
}, {
	apply: function (target, thisArg, args) {
		return SoundFXService.getInstance()
	}
})) as () => SoundFXService


// BIND TO PROVIDER
Container.bind(SoundFXService).provider({ get: getSoundFXService })

export default getSoundFXService

// HMR - SETUP
if (instanceContainer.instance) {
	// TODO: HMR / Do state update stuff here
	log.info(`Reloaded from HMR`)
}
setDataOnHotDispose(module, () => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer: assign(instanceContainer, {
		hotInstance: instanceContainer.instance
	}),
	getSoundFXService
}))
acceptHot(module, log)

