import {getServiceManager} from "shared/services"
import storeBuilder from 'shared/store/AppStoreBuilder'

const log = getLogger(__filename)





export class MainConfigurator {
	
	private requestedServices:any[]

	
	
	constructor() {

	}
	
	/**
	 * Initialize the main config
	 *
	 * @param requestedServices
	 * @returns {MainConfigurator}
	 */
	async init(...requestedServices:any[]):Promise<this> {

		// Set services
		this.requestedServices = requestedServices

		// Load Redux-Store FIRST
		log.info('Loading the REDUX store')
		await storeBuilder()

		return this
	}


	/**
	 * Start all the services
	 *
	 * @returns {any}
	 */
	async start():Promise<any> {

		// Just in case this is an HMR reload
		await this.stop()
		
		log.info('Starting all services')
		await getServiceManager().start()
		
		
	}

	/**
	 * Stop everything
	 *
	 * @returns {Promise<T>|Promise<T|U>}
	 */
	async stop() {
		await getServiceManager().stop()
	}


}


export default MainConfigurator