// IMPORTS
import './UIGlobals'
import { MainBooted } from "shared/Constants"


const log = getLogger(__filename)

if (Env.isDev && !Env.isTest) {
	require('./UIDevConfig')
}

/**
 * Boot everything up
 */
async function boot() {
	
	const storeBuilder = require('shared/store/AppStoreBuilder').default
	await storeBuilder()
	
	// Start the app store server
	const
		startAppStoreServer = ProcessConfig.isStorybook() ? async () => () => null :
			require('shared/store/AppStoreServer').start,
		
		stopAppStoreServer = await startAppStoreServer()
	
	
	log.info(`App store server is up`)
	const
		getServiceManager = require('shared/services').getServiceManager,
		{ipcRenderer} = require('electron')
	
	
	// Check if the main process is completely loaded - if not then wait
	if (!require('electron').remote.getGlobal(MainBooted)) {
		ipcRenderer.send('epictask-start-children')
		
		log.info(`Going to wait for epictask-children-ready`)
		
		const childrenDeferred = Promise.defer()
		ipcRenderer.on('epictask-children-ready', () => {
			log.info(`Got notification from main - kids are ready`)
			childrenDeferred.resolve()
		})
		
		await childrenDeferred.promise
	}
	
	// HMR STOP SERVICES
	if (module.hot) {
		module.hot.addDisposeHandler(() => {
			try {
				getServiceManager().stop()
			} catch (err) {
				log.error(`Failed to stop services`,err)
			}
		})
	}
	
	log.info('Starting all services')
	await getServiceManager().start()
	
	// Load Styles
	require('shared/themes/styles')
	
	// Now the theme manager
	require("shared/themes/ThemeManager")
	
	// Finally load the AppRoot
	// require.ensure(['ui/components/root/AppRoot'],function(require) {
	// 	require('ui/components/root/AppRoot')
	// })
	require('ui/components/root/AppRoot')
}

// Kick it off
boot().then(() => console.log('Booted App'))


if (module.hot) {
	module.hot.accept(() => log.info(`hot reload`,__filename))
}