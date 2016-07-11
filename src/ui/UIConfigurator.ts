import {ObservableStore} from 'typedux'
import {Container} from 'typescript-ioc'
import {getLogger} from 'typelogger'

const log = getLogger(__filename)

async function boot() {

	// Load Redux-Store FIRST

	const store:ObservableStore<any> = require('shared/store').initStore()
	Container.bind(ObservableStore).provider({ get: () => store})


	// Load logger


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
