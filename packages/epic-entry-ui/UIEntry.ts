// IMPORTS
//import './UIGlobals'
//import 'ui/NavManager'

import { Events } from "epic-global"
import { acceptHot, addHotDisposeHandler } from  "epic-common"
import { benchmark } from  "epic-common"
import { benchmarkLoadTime } from  "epic-common"
import { SimpleMenuManagerProvider } from  "epic-command-manager"

benchmarkLoadTime(`Starting UIEntry`)

const
	log = getLogger(__filename)

const setupDevTools = benchmark('Setup dev tools',() => {
	if (Env.isDev && !Env.isTest) {
		require('./UIDevConfig')
	}
})


/**
 * Start the command manager
 */
const setupCommandManager = benchmark('Setup Command Manager', () => {
	log.debug(`Loading the CommandManager - 1st`)
	
	const
		commandManager = require('epic-command-manager').getCommandManager()
	
	commandManager.setMenuManagerProvider(SimpleMenuManagerProvider)
})

/**
 * Ensure the main process starts the DatabaseServer
 * and the job server
 */
const childServicesBoot = benchmark('Child service boot', async () => {
	
	
	if (!require('electron').remote.getGlobal(Events.MainBooted)) {
		const
			{ ipcRenderer } = require('electron')
		
		ipcRenderer.send('epictask-start-children')
		
		log.debug(`Going to wait for epictask-children-ready`)
		
		const
			childrenDeferred = Promise.defer()
		
		ipcRenderer.on(Events.ChildrenReady, () => {
			log.debug(`Got notification from main - kids are ready`)
			childrenDeferred.resolve()
		})
		
		await childrenDeferred.promise
	}
})

/**
 * Boot everything up
 */
const boot = benchmark('UIBoot', async ()=> {
	
	benchmarkLoadTime(`Boot starting`)
	const
		storeBuilder = require('epic-typedux').AppStoreBuilder
	
	await storeBuilder()
	
	benchmarkLoadTime(`Store built`)
	
	let
		stopAppStoreServer = null
	
	// APP STORE SERVER RUNS ON MAIN UI PROCESS ONLY
	if (ProcessConfig.isType(ProcessType.UI)) {
		log.debug(`Starting AppStoreServer`)
		stopAppStoreServer = await require('epic-typedux').AppStoreServer.start()
		
		addHotDisposeHandler(module, () => {
			stopAppStoreServer()
		})
		
		
		log.info(`App store server is up`)
		
		
		// Check if the main process is completely loaded - if not then wait
		await childServicesBoot()
		
	}
	
	benchmarkLoadTime(`Getting service manager`)
	
	// START THE SERVICE MANAGER EVERYWHERE
	const
		getServiceManager = require('epic-services').getServiceManager
	
	benchmarkLoadTime(`Starting services`)
	
	// HMR STOP SERVICES
	addHotDisposeHandler(module,() => {
		try {
			getServiceManager().stop()
		} catch (err) {
			log.error(`Failed to stop services`, err)
		}
	})
	
	
	log.info('Starting all services')
	await getServiceManager().start()
	benchmarkLoadTime(`services started`)
	
	// Load Styles
	require('epic-styles')
	
	
	benchmarkLoadTime(`themes loaded`)
	// Finally load the AppRoot (sep chunk - faster compile - i hope)
	require.ensure(['ui/components/root/AppRoot'],function(require) {
		benchmarkLoadTime(`Loading app root`)
		require('ui/components/root/AppRoot')
		benchmarkLoadTime(`Loaded App root`)
	})
	//
	// require('ui/components/root/AppRoot')

})


// BENCHMARK
benchmarkLoadTime(`before dev tools & command manager`)
setupDevTools()
benchmarkLoadTime(`after dev tools`)
setupCommandManager()

benchmarkLoadTime(`after command manager`)
boot().then(() => console.log('Booted App'))

acceptHot(module,log)
