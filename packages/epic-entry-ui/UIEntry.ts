///<reference path="../epic-entry-shared/AppEntry.ts"/>
import "epic-entry-shared/AppEntry"
import { acceptHot, addHotDisposeHandler, benchmark, benchmarkLoadTime, getHot, setDataOnHotDispose } from "epic-global"
import {loadUI as LoadUIGlobal} from './AppRoot'
import { loadProcessClientEntry, ProcessType } from "epic-entry-shared"


const
	{ProcessClientEntry} = loadProcessClientEntry()


polyfillRequire(__non_webpack_require__)

benchmarkLoadTime(`Starting UIEntry`)

const
	log = getLogger(__filename),
	startupPromises = []
	
let
	stopAppStoreServer = null

export const UIResourcesLoaded = Promise.defer()

/**
 * Setup dev tools
 */
const setupDevTools = benchmark('Setup dev tools',() => {
	const
		deferred = Promise.defer()
	
	//require.ensure([],function(require:any) {
		require('./UIDevConfig')
		deferred.resolve()
	//})
	
	return deferred.promise
})



/**
 * Start the command manager
 */
const setupCommandManager = benchmark('Setup Command Manager', () => {
	const
		deferred = Promise.defer()
	
	
	log.debug(`Loading the CommandManager - 1st`)
	
	//require.ensure([],function(require:any) {
		const
			{SimpleMenuManagerProvider,getCommandManager} = require('epic-command-manager')
		
		getCommandManager().setMenuManagerProvider(SimpleMenuManagerProvider)
		deferred.resolve()
	//})
	
	return deferred.promise
	
})



/**
 * Setup/Load Styles
 */
function setupUI() {
	const
		deferred = Promise.defer()
	
	benchmarkLoadTime(`Styles Loaded`)
	const
		loadUI = require('./AppRoot').loadUI as typeof LoadUIGlobal
	
	loadUI(UIResourcesLoaded.promise)
	deferred.resolve()
	
	// require.ensure([],function(require:any) {
	// 	// Load Styles
	//
	// })
	
	return deferred.promise
}

export class UIEntry extends ProcessClientEntry {
	constructor() {
		super(ProcessType.UI)
	}
	
	/**
	 * Services are disabled on the database server
	 *
	 * @returns {boolean}
	 */
	servicesEnabled() {
		return true
	}
	
	/**
	 * Called to start the worker
	 */
	protected async start() {
		if (Env.isDev && !Env.isTest) {
			startupPromises.push(setupDevTools())
		}
		
		startupPromises.push(setupCommandManager())
		
		
		
		startupPromises.push(setupUI())
		
		await Promise.all(startupPromises)
	}
	
	/**
	 * Called to stop the worker
	 */
	protected async stop(exitCode) {
		
	}
	
	async init() {
		await require('epic-typedux/store/AppStoreBuilder').storeBuilder()
		
		UIResourcesLoaded.resolve()
	}
	
}


export const uiEntry = getHot(module,'uiEntry',new UIEntry())

setDataOnHotDispose(module,() => ({
	uiEntry
}))


acceptHot(module,log)
