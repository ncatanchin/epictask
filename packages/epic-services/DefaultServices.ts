

const
	log = getLogger(__filename)

import './DatabaseClientService'
import './AppStateService'
import './UIStateService'
import './RepoStateService'
import './ToastService'

if (module.hot) {
	module.hot.accept([
		'./DatabaseClientService',
		'./AppStateService',
		'./UIStateService',
		'./RepoStateService',
		'./ToastService'
	],(updates) => {
		
		log.info(`HMR Updates`,updates)
		
		require('./DatabaseClientService')
		require('./AppStateService')
		require('./UIStateService')
		require('./RepoStateService')
		require('./ToastService')
	})
}