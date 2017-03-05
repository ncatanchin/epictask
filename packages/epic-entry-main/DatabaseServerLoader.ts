
import {
	DatabaseServerWindowConfig
} from "epic-process-manager-client/WindowConfig"
import { getWindowManager } from "epic-process-manager"
import { AppEventType } from "epic-global/Constants"
import Electron from 'epic-electron'
import { handleError } from "epic-entry-main/BootErrorHandler"
import { acceptHot,setDataOnHotDispose,getHot } from "epic-global/HotUtils"


const
	log = getLogger(__filename),
	{ dialog,app } = Electron

let
	dbStartCount = getHot(module,'dbStartCount',0),
	dbReady:Promise.Resolver<any> = getHot(module,'dbReady',null),
	attemptDeferred:Promise.Resolver<any> = getHot(module,'attemptDeferred',null),
	windowManager:IWindowManagerClient = getHot(module,'windowManager',null)

setDataOnHotDispose(module,() => ({
	dbStartCount,
	dbReady,
	attemptDeferred,
	windowManager
}))

acceptHot(module)

/**
 * Subscribe for db ready events
 */
EventHub.on(AppEventType.DatabaseReady,(event:AppEventType, errJson:any) => {
	log.info(`Database Ready Received`)
	
	if (!dbReady) {
		log.warn(`DB ready is nil`,errJson)
		return
	}
	
	if (errJson) {
		const
			err = new Error(errJson.message)
		
		log.error(`DB failed to init`,errJson,err)
		attemptDeferred.reject(err)
		return
	}
	
	attemptDeferred.resolve()
})


/**
 * Attempt to start database server
 *
 * @returns {Promise<void>}
 */
async function tryStart() {
	dbStartCount++
	
	log.info(`Database start attempt: ${dbStartCount}`)
	
	attemptDeferred = Promise.defer()
	
	try {
		await windowManager.open(DatabaseServerWindowConfig)
		await attemptDeferred.promise
		
		dbReady.resolve()
	} catch (err) {
		log.error(`Failed to start database server`,err)
		
		handleError("Database Error",`Database did not start, reason: ${err.message}`,err)
		
	}
}

/**
 * Load any pre-configured windows from state + background windows
 */
export async function start() {
	if (dbReady)
		return dbReady.promise
	
	// GET WINDOW MANAGER
	windowManager = getWindowManager()
	
	// SETUP THE RESOLVER
	dbReady = Promise.defer()
	
	tryStart()
	
	await dbReady.promise
	
	log.info(`Database is ready`)
	
}