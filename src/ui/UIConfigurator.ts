import {getLogger} from 'typelogger'
import {getServiceManager} from "shared/services"

const log = getLogger(__filename)

async function boot() {
	
	log.info('Starting all services')
	await getServiceManager().start()
	
	// Load Styles
	require('shared/themes/styles')

	// Now the theme manager
	require("shared/themes/ThemeManager")

	log.info('Loading app root')
	
	
	
	
	const loadAppRoot = () => require('ui/components/root/AppRoot')
	loadAppRoot()
	
	
	
	if (module.hot) {
		module.hot.accept(['ui/components/root/AppRoot'], (updates) => {
			log.info('HMR Updates, reloading app content',updates)
			loadAppRoot()
		})

		module.hot.dispose(() => {
			log.info('HMR AppEntry Update')
		})
	}
}


boot().then(() => console.log('Booted App'))

export {

}
