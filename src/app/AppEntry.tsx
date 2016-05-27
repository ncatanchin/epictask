
const log = require('typelogger').create(__filename)

function loadAppRoot() {
	require('./AppRoot')
}

loadAppRoot()

if (module.hot) {
	module.hot.accept(['./AppRoot'], (updates) => {
		log.info('HMR Updates',updates)
		loadAppRoot()
	})
}




