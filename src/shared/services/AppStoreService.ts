import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import {ObservableStore} from 'typedux'
import storeBuilder from 'shared/store/AppStoreBuilder'
import {ProcessType,AllProcessTypes} from "shared/ProcessType"

const log = getLogger(__filename)

@RegisterService(...AllProcessTypes)
export class AppStoreService extends BaseService {
	
	store:ObservableStore<any>
	
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {[]}
	 */
	dependencies(): IServiceConstructor[] {
		return []
	}
	
	constructor() {
		super()
	}
	
	async start():Promise<this> {
		log.info(`BUILDING APP STORE`)
		// If state server, then use the server enhancer
		const enhancer = ProcessConfig.isType(ProcessType.StateServer) ?
			require('server/ServerStoreEnhancer').default :
			null
		
		log.info(`Building Store with Enhancer ${!!enhancer}`)
		
		this.store = await storeBuilder(enhancer)
		
		return super.start()
	}
	
	async stop():Promise<this> {
		return super.stop()
	}
	
	destroy():this {
		return this
	}

}

export default AppStoreService


if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}
