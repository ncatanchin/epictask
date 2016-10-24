


//import 'shared/NodeEntryInit'

import { acceptHot } from  "epic-common"

import * as AppWindowType from './AppWindow'
import checkSingleInstance from "./CheckSingleInstance"
import {
	getServiceManager as getServiceManagerType
} from "epic-services"
import { Events } from "epic-global"
import { getProcessManager } from "epic-process-manager"


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
	return (require('epic-services').getServiceManager as typeof getServiceManagerType)()
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


export function loadCommandManager() {
	const
		commandManagerMod = require('epic-command-manager'),
		commandManager = commandManagerMod.getCommandManager(),
		
		electronMenuProvider =
			require('epic-command-manager')
				.ElectronMainManagerProvider
	
	
	commandManager.setMenuManagerProvider(electronMenuProvider)
	return commandManager
}

/**
 * Boot the app
 */
async function boot() {
	
	if (Env.isDev)
		require('./MainDevConfig')

	require('./NavManager')
	
	log.debug("Boot start")
	loadCommandManager()
	
	global[Events.MainBooted] = false
	
	log.debug("Load Main Window")
	
	const
		appWindow = require('./AppWindow') as typeof AppWindowType
	
	// Load the main window & start the loader animation
	await appWindow.start(async () => {
		log.debug('Starting Services')
		
		await startProcesses()
		await start()
		
		log.debug('Services started')
	})

	// Notifying the main window that we are ready
	global[Events.MainBooted] = true
	
	setImmediate(() => {
		appWindow.ready()
	})
	
	
}


/**
 * App started
 */
function onStart() {
	app.on('open-file',onOpen)
	app.on('open-url',onOpen)
	
	//app.setName('EpicTask')
	return boot()
}

if (checkSingleInstance(app,onFocus)) {
	log.debug(`Is single instance`)
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

