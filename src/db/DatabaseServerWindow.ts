
import path = require('path')
import * as uuid from 'node-uuid'
import {DatabaseEvents} from 'shared/DatabaseEvents'
import {IDatabaseResponse, IDatabaseRequest} from 'shared/DatabaseRequestResponse'
import {Container} from 'typescript-ioc'

const TIMEOUT = 120000
	

const
	log = getLogger(__filename),
	ipc = require('node-ipc')




/**
 * Database entry template
 *
 * @type {string}
 */
//const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-db-entry.html')



/**
 * A database error occured
 */
export class DatabaseError extends Error {

	constructor(
		public code,
		public description,
		public url
	) {
		super(description)
	}
}

/**
 * Pending database request - internal
 */
interface IDatabasePendingRequest {
	request:IDatabaseRequest
	deferred:Promise.Resolver<any>
}



/**
 * DatabaseWindow wraps the background
 * renderer process that is used to manage
 * database requests
 *
 */

export class DatabaseClient {

	private pendingRequests:{[id:string]:IDatabasePendingRequest} = {}
	
	
	private connected:boolean
	
	/**
	 * Check if the IPC client is connected
	 *
	 * @throws if not connected
	 */
	private checkConnected() {
		assert(this.connected,`Database Client is not connected`)
	}
	
	/**
	 * Get the IPC Database Server
	 *
	 * @returns {any}
	 */
	private getDatabaseServer() {
		return ipc.of.DatabaseServer
	}
	
	/**
	 * Remove all IPC listeners
	 */
	private removeListeners() {
		this.getDatabaseServer().removeListener(DatabaseEvents.Response,this.onResponse)
	}
	
	
	/**
	 * Restart the client
	 *
	 * @returns {Promise<this>}
	 */
	private restart() {
		this.removeListeners()
		
		return this.start()
	}
	
	
	/**
	 * On request finished
	 *
	 * @param request
	 * @returns {()=>void}
	 */
	private onRequestFinished(request:IDatabaseRequest):() => void {
		return () => {
			delete this.pendingRequests[request.id]
		}
	}

	/**
	 * onResponse received from window,
	 * map it back to request and resolve
	 *
	 * @param event
	 * @param resp
	 */
	private onResponse = (event,resp:IDatabaseResponse) => {
		log.debug('Response Received',resp.requestId)

		const pendingRequest = this.pendingRequests[resp.requestId]
		if (!pendingRequest) {
			log.error(`Response received, but no request found with provided id: ${resp.requestId}`,resp.error)



			return
		}

		if (resp.error)
			pendingRequest.deferred.reject(_.isError(resp.error) ? resp.error : new Error(resp.error as any))
		else
			pendingRequest.deferred.resolve(resp.result)

	}


	/**
	 * onTimeout Handler
	 *
	 * @param request
	 * @param deferred
	 * @returns {Promise.Resolver<any>}
	 */
	private onTimeout(request:IDatabaseRequest,deferred:Promise.Resolver<any>) {
		return (err:Promise.TimeoutError) => {
			log.error(`Database request timed out (${request.id})`,err)
			deferred.reject(new DatabaseError('TIMEOUT',err.toString(),''))
		}
	}


	/**
	 * HMR - Hot Module Replacement setup
	 */
	private hmrSetup() {
		if (module.hot) {
			module.hot.dispose(() => {
				log.info(`Disposing`,__filename)
				this.stop()
			})
		}
	}
	
	
	




	/**
	 * Direct database request
	 *
	 * @param fn
	 * @param args
	 */
	request(fn:string,args:any[])
	/**
	 * Request data from a store (ie user = UserStore, etc)
	 * NOTE: Mapped props on Stores class
	 * @param store
	 * @param fn
	 * @param args
	 */
	request(store:string,fn:string,args:any[])
	request(storeOrFn:string,fnOrArgs:string|any[],finalArgs:any[] = null) {
		
		this.checkConnected()
		

		// Map the correct overload
		const [store,fn,args] = ((_.isString(fnOrArgs)) ?
			[storeOrFn,fnOrArgs,finalArgs] :
			[null,storeOrFn,fnOrArgs]
		)


		assert(fn && args,'Both args and fn MUST be defined')



		// Create the request
		const request = {
			id: `${store || 'db'}-${fn}-${uuid.v1()}`,
			store,
			fn,
			args
		}

		// Configure the promise timeout
		const deferred = Promise.defer()
		deferred.promise
			.timeout(TIMEOUT)

			// Catch and remap timeout error
			.catch(Promise.TimeoutError,this.onTimeout(request,deferred))

			// Finally clean up the request
			.finally(this.onRequestFinished(request))

		// Map the pending request
		const pendingRequest:IDatabasePendingRequest =
			this.pendingRequests[request.id] = {
				request,
				deferred
			}

		// Send the request
		this.getDatabaseServer().emit(DatabaseEvents.Request,request)

		// Return the promise
		return pendingRequest.deferred.promise
	}


	/**
	 * Bind events listeners
	 */
	private bindListeners() {
		this.removeListeners()

		// // On Ready - Database can serve requests
		// ipcMain.on(Events.Ready,this.onReady)
		//
		// // Attach shutdown request
		// ipcMain.on(Events.Shutdown,this.onShutdown)

		// Attach Response listener
		this.getDatabaseServer().on(DatabaseEvents.Response,this.onResponse)
	}

	/**
	 * Start the database server
	 *
	 * @returns {Promise<any>}
	 */
	start():Promise<any> {
		
		
		// TODO - CREATE IPC CLIENT
		
		if (this.startDeferred) {
			if (module.hot && !_.get(this,'window.webContents')) {
				log.warn(`In hot - start called, second time, window bad so reseting`)
				return this.restart()
			}

			log.info('Started already, returning existing promise')
			return this.startDeferred.promise
		}

		log.info('Creating deferred')
		const deferred = this.startDeferred = Promise.defer(),
			{promise} = deferred

		

		log.info(`Setting timeout on start promise`)
		promise.timeout(30000)


		try {

			const show = Env.isDev && SHOW_WINDOW

			const windowOptions = {show}

			// If we are going to show the window
			// for dev then add window manager
			let dbWindowState = null
			if (show) {
				dbWindowState = windowStateKeeper({
					defaultWidth: 800,
					defaultHeight: 600,
					file: 'db-window-state.json'
				})
				assign(windowOptions, dbWindowState)
			}


			// Create the window
			log.info('Creating window')
			const dbWindow = this.window = new BrowserWindow(windowOptions)

			// If we are managing state then attach it
			if (dbWindowState)
				dbWindowState.manage(dbWindow)


			this.bindListeners()


			dbWindow.webContents.on('did-fail-load',(event,code,desc,url,mainFrame) => {
				log.error('database content failed to load',event,code,desc,url)

				deferred.reject(new DatabaseError(code,desc,url))
			})

			if (Env.isDev)
				dbWindow.webContents.openDevTools()

			dbWindow.webContents.on('did-finish-load',() => {
				log.info('DatabaseWindow is loaded')
			})

			dbWindow.on('closed',this.onClosed)

			log.info('Load')
			dbWindow.loadURL(templateURL)

			log.info('HMR')
			this.hmrSetup()


		} catch (err) {
			log.error('failed to start', err)
			deferred.reject(err)
		}

		return this.startDeferred.promise
	}

	/**
	 * Stop the database
	 *
	 * @returns {any}
	 */
	stop(isHot = false):Promise<any> {
		// if (isHot) {
		// 	this.unbindEvents()
		// 	return Promise.resolve(true)
		// }

		// if (this.internalStatus > DatabaseStatus.Started || !this.window)
		// 	return Promise.resolve(true)
		//
		//
		// const promise = (this.stopDeferred = Promise.defer()).promise
		// promise.timeout(5000).catch((err) => {
		// 	log.error(`Failed to stop`,err)
		// })
		//
		// this.window.close()
		ipc.disconnect('DatabaseServer')
		return Promise.resolve(true)

	}

}

/**
 * Create a singleton instance
 *
 * @type {DatabaseClient}
 */
const databaseClient = new DatabaseClient()

// Start it
databaseClient.start()

// Set container provider
Container.bind(DatabaseClient).provider({get: () => databaseClient})


export function getDatabaseClient():DatabaseClient {
	return databaseClient
}


/**
 * Export the class
 */
export default DatabaseClient


if (module.hot) {
	module.hot.dispose(() => {
		try {
			databaseClient.stop()
		} catch (err) {}
	})
	module.hot.accept()
}