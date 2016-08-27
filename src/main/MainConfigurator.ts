import {getServiceManager} from "shared/services"
import WorkerManager from 'shared/WorkerManager'
const log = getLogger(__filename)

export namespace MainConfigurator {
	/**
	 * Start all the services
	 *
	 * @returns {any}
	 */
	export async function start(): Promise<any> {
		
		await WorkerManager.startAll()
		
		log.info('Starting all services')
		await getServiceManager().start()
		
		
	}
	
	/**
	 * Stop everything
	 *
	 * @returns {Promise<T>|Promise<T|U>}
	 */
	export async function stop() {
		await getServiceManager().stop()
	}
	
}


export default MainConfigurator