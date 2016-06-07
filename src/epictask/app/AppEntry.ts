import 'shared/CommonEntry'
import './AppGlobals'

import {starter} from 'epictask/shared/DBService'

starter.then(() => {
	console.log('Db Started')

	const log = getLogger(__filename)

	function loadAppContent() {

		// First load services
		require('./services')

		// Load Styles
		require('./styles')

		// Load App Root
		require('./components/root/AppRoot.tsx')

	}

	loadAppContent()

	if (module.hot) {
		module.hot.accept(['./components/root/AppRoot.tsx'], (updates) => {
			log.info('HMR Updates, reloading app content',updates)
			loadAppContent()
		})

		module.hot.accept()
		module.hot.dispose(() => {
			log.info('HMR AppEntry Update')
		})
	}

})

