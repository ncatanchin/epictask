// IMPORTS
import './UIGlobals'
import { MainBooted } from "shared/Constants"
import { acceptHot, addHotDisposeHandler } from "shared/util/HotUtils"
import { benchmark } from "shared/util/Benchmark"


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
	require('shared/commands/CommandManager').getCommandManager()
})

/**
 * Ensure the main process starts the DatabaseServer
 * and the job server
 */
const childServicesBoot = benchmark('Child service boot', async () => {
	
	
	if (!require('electron').remote.getGlobal(MainBooted)) {
		const
			{ ipcRenderer } = require('electron')
		
		ipcRenderer.send('epictask-start-children')
		
		log.debug(`Going to wait for epictask-children-ready`)
		
		const
			childrenDeferred = Promise.defer()
		
		ipcRenderer.on('epictask-children-ready', () => {
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
	
	const
		storeBuilder = require('shared/store/AppStoreBuilder').default
	
	await storeBuilder()
	
	let
		stopAppStoreServer = null
	
	// APP STORE SERVER RUNS ON MAIN UI PROCESS ONLY
	if (ProcessConfig.isType(ProcessType.UI)) {
		log.debug(`Starting AppStoreServer`)
		stopAppStoreServer = await require('shared/store/AppStoreServer').start()
		
		addHotDisposeHandler(module, () => {
			stopAppStoreServer()
		})
		
		
		log.info(`App store server is up`)
		
		
		// Check if the main process is completely loaded - if not then wait
		await childServicesBoot()
		
	}
	
	// START THE SERVICE MANAGER EVERYWHERE
	const
		getServiceManager = require('shared/services').getServiceManager
	
	
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
	
	// Load Styles
	require('shared/themes/styles')
	
	// Now the theme manager
	require("shared/themes/ThemeManager")
	
	// Finally load the AppRoot
	require('ui/components/root/AppRoot')

})

// Kick it off
setupDevTools()
setupCommandManager()
boot().then(() => console.log('Booted App'))

acceptHot(module,log)
