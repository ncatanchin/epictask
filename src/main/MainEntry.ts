
require('shared/NodeEntryInit')

import checkSingleInstance from "main/CheckSingleInstance"
import {RemoteDebuggingPort, Events, MainBooted} from 'shared/Constants'
import * as MainWindowType from './MainWindow'
import {getServiceManager as getServiceManagerType} from "shared/services"
import {ChildProcessManager as ChildProcessManagerType} from 'shared/ChildProcessManager'

const
	{app,BrowserWindow} = require('electron'),
	log = getLogger(__filename),
	hotReloadEnabled = Env.isHot


// ADD EVENTS TO GLOBAL
_.assignGlobal({Constants:{Events}})


// Reference for dev monitor window (redux, etc)
let
	mainWindow:any,
	devWindow = null,
	ProcessManager:typeof ChildProcessManagerType = null,
	processesRunning = false

log.info(`Hot reload mode enabled: ${hotReloadEnabled}`)

/**
 * In debug mode enable remote debugging
 */
if (Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}


function getServiceManager() {
	return (require('shared/services').getServiceManager as typeof getServiceManagerType)()
}

/**
 * Start all the services
 *
 * @returns {any}
 */
async function start(): Promise<any> {
	await getServiceManager().start()
}

/**
 * Stop everything
 *
 * @returns {Promise<T>|Promise<T|U>}
 */
async function stop() {
	await getServiceManager().stop()
}


/**
 * Callback from open if already running
 */
function onFocus() {
	
	// Someone tried to run a second instance, we should focus our window.
	const win = mainWindow && mainWindow.getBrowserWindow()
	
	if (win) {
		win && win.isMinimized() && win.restore()
		win.focus()
	}
	
	
}


/**
 * On shutdown intercepts quit requests and makes sure
 * all children are properly shutdown/killed
 *
 * @param event
 */
function onShutdown(event) {
	
	if (ProcessManager && processesRunning) {
		processesRunning = false
		
		event.preventDefault()
		
		const killAll = async () => {
			try {
				await ProcessManager.stopAll()
			} catch (err) {
				log.warn(`Failed to cleanly shutdown processes`)
			}
			
			BrowserWindow.getAllWindows().forEach(win => {
				try {
					win.destroy()
				} catch (err) {
					log.warn(`Failed to destroy window`,err)
				}
			})
			
			app.quit()
		}
		
		killAll()
	}
}

app.on('will-quit',onShutdown)

/**
 * Start all child processes
 *
 * JobServer
 * DatabaseServer
 */
async function startProcesses() {
		
	ProcessManager = require('shared/ChildProcessManager').ChildProcessManager as typeof ChildProcessManagerType
	
	// HMR STOP PROCESSES
	if (module.hot) {
		
		module.hot.addDisposeHandler(() => {
			try {
				ProcessManager.stopAll()
			} catch (err) {
				log.error(`Failed to stop sub-processes`,err)
			}
		})
	}
	
	
	log.info(`Starting all processes`)
	await ProcessManager.startAll()
	processesRunning = true
	
}

/**
 * Boot the app
 */
async function boot() {

	if (Env.isDev)
		require('./MainDevConfig')

	log.info("Boot start")
	global[MainBooted] = false
	
	log.info("Load Main Window")
	mainWindow = require('./MainWindow') as typeof MainWindowType
	
	// Load the main window & start the loader animation
	await mainWindow.start(async () => {
		log.info('Starting Services')
		await startProcesses()
		await start()
		
		log.info('Services started')
	})

	// Notifying the main window that we are ready
	global[MainBooted] = true
	
	setImmediate(() => {
		mainWindow.ready()
	})
}

/**
 * All windows closed
 */
function onAllClosed() {
	log.debug('All windows closed')

	if (process.platform !== 'darwin')
		app.quit()
}

/**
 * App started
 */
function onStart() {
	app.setName('EpicTask')
	return boot()
}

if (checkSingleInstance(app,onFocus)) {
	if (!Env.isHot)
		app.on('window-all-closed', onAllClosed)
	
	// app.on('will-quit',onWillQuit)
	app.on('ready', onStart)
}

/**
 * Enable HMR
 */
if (module.hot) {
	console.info('Setting up HMR')

	
	// Main window or configurator - reboot app
	module.hot.accept(['./MainWindow'], (mods) => {
		log.info("Rebooting main, updated dependencies",mods)

		// We get a reference to the new window here
		return boot().then(() => {
			const newWindow = mainWindow.getBrowserWindow()

			require('electron').BrowserWindow.getAllWindows()
				.filter(win => win !== newWindow && win !== devWindow)
				.forEach(oldWindow => oldWindow.close())

		})

	})

	// Worst case - accept myself??
	module.hot.accept()

}
