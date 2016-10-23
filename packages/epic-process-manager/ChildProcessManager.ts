import ChildProcessRenderer from './ChildProcessRenderer'
import ProcessType from "shared/ProcessType"
import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"

const log = getLogger(__filename)

// Check HMR first
const
	children:ChildProcessRenderer[] = getHot(module,'children',[]),
	{ipcMain} = require('electron')


// Add handler to set on dispose
setDataOnHotDispose(module,() => ({
	children
}))

/**
 * Worker boot order,
 * in boot stages
 *
 * @type {ProcessType[][]}
 */
const ChildProcessBootOrder = [
	[ProcessType.DatabaseServer],
	[ProcessType.JobServer]
]



export namespace ChildProcessManager {
	
	let running = false
	
	ipcMain.on('child-message',(event,{processTypeName,workerId,type,body}) => {
		const child = children.find(it => it.processType === ProcessType[processTypeName] as any)
		assert(child,`Unable to find child for ${processTypeName} / ${workerId} / ${type}`)
		
		child.handleMessage(type,body)
	})
	
	/**
	 * isRunning - processes are running
	 */
	export function isRunning() {
		return running
	}
	
	/**
	 * Start a worker for a specific process type
	 *
	 * @param processType
	 * @returns {Promise<boolean>}
	 */
	export function start(processType:ProcessType)
	/**
	 * Start a worker for a specific process type
	 *
	 * @param processType
	 * @param id
	 * @returns {Promise<boolean>}
	 */
	export function start(processType:ProcessType,id:string)
	export function start(processType:ProcessType,id:string = null):Promise<any> {
		
		const
			processName = `${ProcessConfig.getTypeName(processType)}-${id || 0}`,
			
			// Check to see if the process is already running
			existingChild = children.find(it => it.name === processName)
		
		if (existingChild) {
			log.warn(`Process id is already running`,existingChild)
			return Promise.resolve(existingChild)
		}
		
		const
			worker:ChildProcessRenderer = new ChildProcessRenderer(ChildProcessManager,processName,processType,{
				
				// Env really isn't need with the webView model
				env: {
					EPIC_ENTRY: processName
				}
			})
		
		log.info(`Starting Worker ${processName}`)
		
		
		
		children.push(worker)
		return worker.start()
	}
	
	/**
	 * Start all workers
	 *
	 * @param processTypes - if not provided then boot is assumed and
	 *  all are launched
	 */
	export async function startAll(...processTypes:ProcessType[]) {
		running = true
		
		if (processTypes.length) {
			await Promise.all(processTypes.map(start))
		} else {
			for (let workerSet of ChildProcessBootOrder) {
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
	export function stop(worker:ChildProcessRenderer) {
		const
			workerIndex = children.indexOf(worker)
		
		if (workerIndex === -1) {
			throw new Error(`This worker manager does not manage ${worker.name}`)
		}
		
		children.splice(workerIndex,1)
		
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
		running = false
		return Promise.all(children.reverse().map(worker => worker.stop(exitCode)))
	}
	
	/**
	 * Kill all managed workers
	 *
	 */
	export function killAll() {
		children.reverse().forEach(worker => worker.kill())
	}
	
	//process.on('beforeExit',(exitCode) => stopAll())
	process.on('exit',(exitCode) => killAll())
}

acceptHot(module,log)

export default ChildProcessManager
