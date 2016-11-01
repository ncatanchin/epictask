

const
	log = getLogger(__filename)

/**
 * Load the services require context
 *
 * @returns {any}
 */
export default function loadDefaultServices() {
	return _.merge({},
		require('./DatabaseClientService'),
		require('./AppStateService'),
		require('./UIStateService'),
		require('./RepoStateService'),
		require('./ToastService')
	)
}

if (module.hot) {
	module.hot.accept([
		'./DatabaseClientService',
		'./AppStateService',
		'./UIStateService',
		'./RepoStateService',
		'./ToastService'
	],(updates) => {
		log.info(`HMR Updates`,updates)
		loadDefaultServices()
	})
}