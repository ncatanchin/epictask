import {getServiceManager} from "shared/services"
import storeBuilder from 'shared/store/AppStoreBuilder'
import Worker from 'shared/Worker'
import * as path from 'path'
import ProcessType,{ProcessNames} from "shared/ProcessType"
const log = getLogger(__filename)





// All existing workers
const
	workerPath = path.resolve(process.cwd(),'dist/AppEntry.js'),
	workers:Worker[] = []

/**
 * Worker boot order,
 * in boot stages
 *
 * @type {ProcessType[][]}
 */
const WorkerBootOrder = [
	[ProcessType.DatabaseServer],
	[ProcessType.Server],
	//[ProcessType.JobServer],
]

/**
 * Start a worker for a specific process type
 *
 * @param processType
 * @returns {Promise<boolean>}
 */
function startWorker(processType:ProcessType) {
	const worker:Worker = new Worker(workerPath,{
		env: {
			EPIC_ENTRY: ProcessNames.DatabaseServer
		}
	})
	
	workers.push(worker)
	return worker.start()
}

/**
 * Start all workers
 */
async function startWorkers() {
	for (let workerSet of WorkerBootOrder) {
		const workerStartPromises = workerSet.map(startWorker)
		await Promise.all(workerStartPromises)
	}
}

process.on('beforeExit',(exitCode) => {
	workers.reverse().forEach(worker => {
		worker.stop(exitCode)
	})
})

process.on('exit',(exitCode) => {
	workers.reverse().forEach(worker => {
		worker.kill()
	})
})

/**
 * Main configurator
 */
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