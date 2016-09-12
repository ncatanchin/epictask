// IMPORTS
import './UIGlobals'
import {getServiceManager as getServiceManagerType} from "shared/services"
import {ProcessManager as ProcessManagerType} from 'shared/ProcessManager'

const log = getLogger(__filename)

if (Env.isDev && !Env.isTest) {
	require('./UIDevConfig')
}

/**
 * Boot everything up
 */
async function boot() {
	
	const
		ProcessManager = require('shared/ProcessManager').ProcessManager as typeof ProcessManagerType,
		getServiceManager = require('shared/services').getServiceManager as typeof getServiceManagerType
	
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
	require('ui/components/root/AppRoot')
	
}

// Kick it off
boot().then(() => console.log('Booted App'))


if (module.hot) {
	module.hot.accept(() => log.info(`hot reload`,__filename))
}