import '../shared/CommonEntry'
import './AppGlobals'
import './services/index'

const log = require('typelogger').create(__filename)

function loadAppContent() {
	require('./components/AppRoot.tsx')
}

loadAppContent()

if (module.hot) {

	module.hot.accept(['./components/AppRoot.tsx'], (updates) => {
		log.info('HMR Updates, reloading app content',updates)
		loadAppContent()
	})

	module.hot.accept()
	module.hot.dispose(() => {
		log.info('HMR AppEntry Update')
	})
}




