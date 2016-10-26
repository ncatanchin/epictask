import "epic-entry-shared/AppEntry"
import { Events, acceptHot, addHotDisposeHandler, benchmark, benchmarkLoadTime } from "epic-global"


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
	
	require.ensure([],function(require:any) {
		require('./UIDevConfig')
		deferred.resolve()
	})
	
	return deferred.promise
})

if (Env.isDev && !Env.isTest) {
	startupPromises.push(setupDevTools())
}


/**
 * Start the command manager
 */
const setupCommandManager = benchmark('Setup Command Manager', () => {
	const
		deferred = Promise.defer()
	
	
	log.debug(`Loading the CommandManager - 1st`)
	
	require.ensure([],function(require:any) {
		const
			{SimpleMenuManagerProvider,getCommandManager} = require('epic-command-manager')
		
		getCommandManager().setMenuManagerProvider(SimpleMenuManagerProvider)
		deferred.resolve()
	})
	
	return deferred.promise
	
})

startupPromises.push(setupCommandManager())

/**
 * Create the store
 *
 * @returns {Promise<T>}
 */
const setupStore = benchmark('Start Store and Children',() => {
	benchmarkLoadTime(`Boot starting`)
	const
		deferred = Promise.defer()
	
	require.ensure([], function (require:any) {
		benchmarkLoadTime(`Building store`)
		const
			{ storeBuilder } = require('epic-typedux/store/AppStoreBuilder')
		
		benchmarkLoadTime(`Loaded store builder`)
		
		storeBuilder()
			.then(async() => {
				
				benchmarkLoadTime(`Store built`)
				
				// APP STORE SERVER RUNS ON MAIN UI PROCESS ONLY
				if (ProcessConfig.isType(ProcessType.UI)) {
					log.debug(`Starting AppStoreServer`)
					stopAppStoreServer = await require('epic-typedux/store/AppStoreServer').start()
					
					addHotDisposeHandler(module, () => {
						stopAppStoreServer()
					})
					
					
					log.info(`App store server is up`)
					
					
					// Check if the main process is completely loaded - if not then wait
					await require('./StartChildProcesses').childServicesBoot()
					
				}
				
				// START THE SERVICE MANAGER EVERYWHERE
				benchmarkLoadTime(`Loading getService Manager`)
				const
					getServiceManager = require('epic-services').getServiceManager
				
				benchmarkLoadTime(`Starting services`)
				
				// HMR STOP SERVICES
				addHotDisposeHandler(module, () => {
					try {
						getServiceManager().stop()
					} catch (err) {
						log.error(`Failed to stop services`, err)
					}
				})
				
				
				log.info('Starting all services')
				await getServiceManager().start()
				benchmarkLoadTime(`services started`)
				
				deferred.resolve()
			})
	})
	
	
	return deferred
		.promise
		.then(() => {
				benchmarkLoadTime(`Resolved all resources`)
				UIResourcesLoaded.resolve()
			}
		)
})

startupPromises.push(setupStore())


/**
 * Setup/Load Styles
 */
function setupUI() {
	const
		deferred = Promise.defer()
	
	require.ensure([],function(require:any) {
		// Load Styles
		benchmarkLoadTime(`Styles Loaded`)
		require('./AppRoot').loadUI(UIResourcesLoaded.promise)
		deferred.resolve()
	})
	
	return deferred.promise
}

startupPromises.push(setupUI())


acceptHot(module,log)
