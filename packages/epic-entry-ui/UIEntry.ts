// SCSS FIRST
import 'styles/UIEntry.global.scss'

import "epic-entry-shared/AppEntry"

import { acceptHot, addHotDisposeHandler, benchmark, benchmarkLoadTime, getHot, setDataOnHotDispose } from "epic-global"
import {loadUI as LoadUIGlobal} from './App'
import { ProcessType } from "epic-entry-shared"
import { ProcessClientEntry } from "epic-entry-shared/ProcessClientEntry"
import { PluginManager } from "epic-plugin-manager"

// const
// 	{ProcessClientEntry} = loadProcessClientEntry()


polyfillRequire(__non_webpack_require__)

benchmarkLoadTime(`Starting UIEntry`)

const
	log = getLogger(__filename),
	startupPromises = [],
	UIResourcesLoaded = Promise.defer()

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
	
	require('epic-styles')
	benchmarkLoadTime(`Styles Loaded`)
	
	
	require.ensure([], function(require:any) {
		
		require('epic-ui-core')
		require('epic-ui-issues')
		require('epic-ui-repos')
		require('epic-ui-jobs')
		require('epic-ui-login')
		require('epic-ui-welcome')
		
		const
			loadUI = require('./App').loadUI as typeof LoadUIGlobal
		
		loadUI(UIResourcesLoaded.promise)
	})
	
	
	
	deferred.resolve()
	
	return deferred.promise
}


/**
 * UI entry point
 */
export class UIEntry extends ProcessClientEntry {
	
	/**
	 * Create UI Entry
	 */
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
	 * Before anything else - load up the app store
	 */
	protected async init() {
		await require('epic-typedux/store/AppStoreBuilder').storeBuilder()
		
		log.info(`Preparing UI Modules`)
		const
			ctx = require.context('./services',true),
			moduleIds = ctx.keys()
		
		log.info(`Loading modules`,moduleIds)
		moduleIds.forEach(ctx)
		log.info(`Loaded modules`,moduleIds)
		
		
		UIResourcesLoaded.resolve()
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
		
		log.debug(`Starting internal ui`)
		await Promise.all(startupPromises)
		
		log.debug(`Loading plugin manager`)
		await PluginManager.init()
	}
	
	/**
	 * Called to stop the worker
	 */
	protected async stop(exitCode) {
		
	}
	
	
	
}


export const uiEntry = getHot(module,'uiEntry',new UIEntry())

if (module.hot) {
	module.hot.addStatusHandler(newStatus => {
		if (['abort','fail'].includes(newStatus)) {
			log.error(`HMR failed - reloading`)
			require('electron').remote.getCurrentWindow().webContents.reloadIgnoringCache()
		}
	})
}

setDataOnHotDispose(module,() => ({
	uiEntry
}))


acceptHot(module,log)
