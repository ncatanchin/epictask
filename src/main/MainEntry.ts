


import 'shared/NodeEntryInit'

import { acceptHot } from "shared/util/HotUtils"

import checkSingleInstance from "main/CheckSingleInstance"
import * as MainWindowType from './MainWindow'
import {getServiceManager as getServiceManagerType} from "shared/services"
import { Events } from "shared/config/Events"
import { getProcessManager } from "shared/ProcessManagement"



import './MainAppSwitches'

const
	{app,BrowserWindow} = require('electron'),
	log = getLogger(__filename),
	hotReloadEnabled = Env.isHot


// ADD EVENTS TO GLOBAL
_.assignGlobal({Constants:{Events}})


// Reference for dev monitor window (redux, etc)
log.info(`Hot reload mode enabled: ${hotReloadEnabled}`)



/**
 * Get the service manager
 *
 * @returns {ServiceManager}
 */
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

// ATTACH SERVICE MANAGER STOP TO WILL-QUIT
app.on('will-quit',stop)

/**
 * Callback from open if already running
 */
function onFocus() {
	
	// APP FOCUS EVENT - LIKELY SOME TRYING TO START SECOND INSTANCE
	const
		allWindows = BrowserWindow.getAllWindows(),
		win = allWindows && allWindows[0]
	
	if (win) {
		win && win.isMinimized() && win.restore()
		win.focus()
	}
	
	
}



/**
 * On open event handler
 *
 * @param event
 */
function onOpen(event) {
	log.info(`Received on open event`,event)
	event.preventDefault()
}


/**
 * Start all child processes
 *
 * JobServer
 * DatabaseServer
 */
async function startProcesses() {
		
	const
		ProcessManager = getProcessManager()
	
	log.info(`Starting all processes`)
	// ONLY OCCURS IN HMR SCENARIO
	if (!ProcessManager.isRunning())
		await ProcessManager.startAll()
	
}

/**
 * Boot the app
 */
async function boot() {
	
	
	
	if (Env.isDev)
		require('./MainDevConfig')

	require('./NavManager')
	
	
	log.debug("Boot start")
	require('shared/commands/CommandManager').getCommandManager()
	global[Events.MainBooted] = false
	
	log.debug("Load Main Window")
	
	const
		mainWindow = require('./MainWindow') as typeof MainWindowType
	
	
	
	// Load the main window & start the loader animation
	await mainWindow.start(async () => {
		log.info('Starting Services')
		await startProcesses()
		await start()
		
		log.info('Services started')
	})

	// Notifying the main window that we are ready
	global[Events.MainBooted] = true
	
	setImmediate(() => {
		mainWindow.ready()
	})
	
	
}


/**
 * App started
 */
function onStart() {
	app.on('open-file',onOpen)
	app.on('open-url',onOpen)
	
	app.setName('EpicTask')
	return boot()
}

if (checkSingleInstance(app,onFocus)) {
	log.info(`Is single instance`)
	// app.on('will-quit',onWillQuit)
	if (app.isReady())
		onStart()
	else
		app.on('ready', onStart)
}

/**
 * Enable HMR
 */

acceptHot(module,log)
// if (module.hot) {
// 	console.info('Setting up HMR')
//
//
// 	// Main window or configurator - reboot app
// 	// module.hot.accept(['./MainWindow'], (mods) => {
// 	// 	log.info("Rebooting main, updated dependencies",mods)
// 	//
// 	// 	// We get a reference to the new window here
// 	// 	// return boot().then(() => {
// 	// 	// 	const newWindow = mainWindow.getBrowserWindow()
// 	// 	//
// 	// 	// 	require('electron').BrowserWindow.getAllWindows()
// 	// 	// 		.filter(win => win !== newWindow && win !== devWindow)
// 	// 	// 		.forEach(oldWindow => oldWindow.close())
// 	// 	//
// 	// 	// })
// 	//
// 	// })
//
// 	// Worst case - accept myself??
// 	module.hot.accept()
//
// }
