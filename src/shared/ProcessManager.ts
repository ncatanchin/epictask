import * as path from 'path'
import Worker from './Worker'
import ProcessType from "shared/ProcessType"

const log = getLogger(__filename)

// All existing workers
const
	workerPath = path.resolve(process.cwd(),'dist/app/AppEntry.bundle.js'),
	workers:Worker[] = []

/**
 * Worker boot order,
 * in boot stages
 *
 * @type {ProcessType[][]}
 */
const WorkerBootOrder = [
	[ProcessType.UI],
	[ProcessType.DatabaseServer],
	[ProcessType.JobServer]
]

export namespace ProcessManager {
	
	/**
	 * Start a worker for a specific process type
	 *
	 * @param processType
	 * @returns {Promise<boolean>}
	 */
	export function start(processType:ProcessType):Promise<any> {
		
		const processName = ProcessConfig.getTypeName(processType)
		log.info(`Starting Worker ${processName}`)
		
		const worker:Worker = new Worker(workerPath,processName,{
			env: {
				EPIC_ENTRY: processName
			}
		})
		
		workers.push(worker)
		return worker.start()
	}
	
	/**
	 * Start all workers
	 *
	 * @param processTypes - if not provided then boot is assumed and
	 *  all are launched
	 */
	export async function startAll(...processTypes:ProcessType[]) {
		if (processTypes.length) {
			await Promise.all(processTypes.map(start))
		} else {
			for (let workerSet of WorkerBootOrder) {
				const workerStartPromises = workerSet.map(start)
				await Promise.all(workerStartPromises)
			}
		}
	}
	
	/**
	 * Stop a specific worker
	 *
	 * @param worker
	 * @returns {any}
	 */
	export function stop(worker:Worker) {
		const workerIndex = workers.indexOf(worker)
		if (workerIndex === -1) {
			throw new Error(`This worker manager does not manage ${worker.name}`)
		}
		
		workers.splice(workerIndex,1)
		
		try {
			log.info(`Stopping process: ${worker.name}`)
			return worker.stop()
		} catch (err) {
			log.warn('Failed to stop worker',err)
			return Promise.reject(new Error(err))
		}
	}
	
	/**
	 * Stop all managed workers
	 *
	 * @param exitCode
	 */
	export function stopAll(exitCode = 0):Promise<any> {
		return Promise.all(workers.reverse().map(worker => worker.stop(exitCode)))
	}
	
	/**
	 * Kill all managed workers
	 *
	 */
	export function killAll() {
		workers.reverse().forEach(worker => worker.kill())
	}
	
	//process.on('beforeExit',(exitCode) => stopAll())
	process.on('exit',(exitCode) => killAll())
}


export default ProcessManager
