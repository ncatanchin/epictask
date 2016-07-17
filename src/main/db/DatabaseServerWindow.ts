
import Electron = require('electron')
import path = require('path')
import * as uuid from 'node-uuid'

import {default as Events} from './DatabaseEvents'
import {IDatabaseResponse, IDatabaseRequest} from 'main/db/DatabaseRequestResponse'

const TIMEOUT = 10000

const log = getLogger(__filename)

const {app,BrowserWindow,ipcMain} = Electron



/**
 * Database entry template
 *
 * @type {string}
 */
const templateURL = 'file://' + path.resolve(process.cwd(),'dist/main-db-entry.html')



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

export enum DatabaseStatus {
	Created = 1,
	Started,
	Shutdown,
	Destroyed
}

/**
 * DatabaseWindow wraps the background
 * renderer process that is used to manage
 * database requests
 *
 */

export class DatabaseServerWindow {


	private internalStatus:DatabaseStatus = DatabaseStatus.Created

	private window:Electron.BrowserWindow

	private pendingRequests:{[id:string]:IDatabasePendingRequest} = {}
	private stopDeferred:Promise.Resolver<any>
	private startDeferred:Promise.Resolver<any>


	/**
	 * Database status
	 *
	 * @type {DatabaseStatus}
	 */

	get status() {
		return this.internalStatus
	}

	/**
	 * Set the internal status
	 *
	 * @param status
	 */
	private setStatus(status:DatabaseStatus) {
		this.internalStatus = status
	}



	/**
	 * Called when the database is shutdown
	 *
	 * @param event
	 */
	private onShutdown = (event) => {
		log.info('shutdown started')
		this.setStatus(DatabaseStatus.Shutdown)
		this.window && this.window.close()

	}

	/**
	 * Callback when the server has closed
	 *
	 * @param event
	 */
	private onClosed = (event) => {
		log.info('closed / shutdown complete')
		this.setStatus(DatabaseStatus.Destroyed)

		if (this.stopDeferred) {
			this.stopDeferred.resolve(true)
			this.stopDeferred = null
		}

		this.window && this.window.destroy()
		this.window = null
	}

	private onRequestFinished(request:IDatabaseRequest) {
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
		log.info('Response Received')

		const pendingRequest = this.pendingRequests[resp.requestId]
		if (!pendingRequest) {
			log.error(`Response received, but no request found with provided id: ${resp.requestId}`,resp)

			if (Env.isDev) {
				debugger
			}

			return
		}

		if (resp.error)
			pendingRequest.deferred.reject(_.isError(resp.error) ? resp.error : new Error(resp.error as any))
		else
			pendingRequest.deferred.resolve(resp.result)

	}


	/**
	 * onReady window callback
	 */
	private onReady = (event) => {

		log.info('DatabaseServer is ready ')

		this.setStatus(DatabaseStatus.Started)
		this.startDeferred.resolve()


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




	private hmrSetup() {
		if (module.hot) {
			module.hot.dispose(() => {
				ipcMain.removeListener(Events.Ready,this.onReady)
				ipcMain.removeListener(Events.Response,this.onResponse)
				ipcMain.removeListener(Events.Shutdown,this.onShutdown)
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

		// Map the correct overload
		const [store,fn,args] = ((_.isString(fnOrArgs)) ?
			[storeOrFn,fnOrArgs,finalArgs] :
			[null,storeOrFn,fnOrArgs]
		)

		assert(fn && args,'Both args and fn MUST be defined')
		assert(this.window && this.status !== DatabaseStatus.Shutdown,'Can not make a request until the database is ready')

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
		this.window.webContents.send(Events.Request,request)

		// Return the promise
		return pendingRequest.deferred.promise
	}

	/**
	 * Start the database server
	 *
	 * @returns {Promise<any>}
	 */
	start():Promise<any> {
		log.info('Checking existing windows first')
		BrowserWindow.getAllWindows().forEach(window => {
			const url = window.webContents.getURL()
			if (url === templateURL) {
				log.warn(`Found existing database window with url ${url} - destroying`)
				window.destroy()
			}
		})

		log.info('Creating deferred')
		const deferred = this.startDeferred = Promise.defer(),
			{promise} = deferred

		log.info(`Setting timeout on start promise`)
		promise.timeout(10000)


		try {

			log.info('Creating window')
			const dbWindow = this.window = new BrowserWindow({
				show: true
			})

			log.info('Subscriptions')
			// On Ready - Database can serve requests
			ipcMain.on(Events.Ready,this.onReady)

			// Attach shutdown request
			ipcMain.on(Events.Shutdown,this.onShutdown)
			ipcMain.on(Events.Response,this.onResponse)


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
	stop():Promise<any> {
		if (this.internalStatus > DatabaseStatus.Started || !this.window)
			return Promise.resolve(true)

		const promise = (this.stopDeferred = Promise.defer()).promise
		promise.timeout(5000).catch((err) => {
			log.error(`Failed to stop`,err)
		})

		this.window.close()
		return promise

	}


}

export default DatabaseServerWindow