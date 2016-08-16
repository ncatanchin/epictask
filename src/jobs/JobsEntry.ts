const
		electron = require('electron'),
		workerId = process.env.ELECTRON_WORKER_ID,
		log = getLogger(__filename)
		





if (module.hot) {
	module.hot.accept(() => log.info('Hot reloaded'))
}