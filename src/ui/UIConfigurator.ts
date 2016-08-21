import {getLogger} from 'typelogger'
import storeBuilder from 'shared/store/AppStoreBuilder'

const log = getLogger(__filename)

async function boot() {

	// Load Redux-Store FIRST
	await storeBuilder()

	// Load Styles
	require('shared/themes/styles')

	// Now the theme manager
	require("shared/themes/ThemeManager.tsx")

	log.info('Loading app root')
	const loadAppRoot = () => require('ui/components/root/AppRoot.tsx')
	loadAppRoot()

	if (module.hot) {
		module.hot.accept(['ui/components/root/AppRoot.tsx'], (updates) => {
			log.info('HMR Updates, reloading app content',updates)
			loadAppRoot()
		})

		module.hot.accept()
		module.hot.dispose(() => {
			log.info('HMR AppEntry Update')
		})
	}
}


boot().then(() => console.log('Booted App'))

export {

}
