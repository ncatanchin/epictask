

const
	log = getLogger(__filename)

import './DatabaseClientService'
import './AppStateService'
import './UIStateService'
import './RepoStateService'
import './NotificationService'
import './NotificationService'

if (module.hot) {
	module.hot.accept([
		'./DatabaseClientService',
		'./AppStateService',
		'./UIStateService',
		'./RepoStateService',
		'./NotificationService'
	],(updates) => {
		
		log.info(`HMR Updates`,updates)
		
		require('./DatabaseClientService')
		require('./AppStateService')
		require('./UIStateService')
		require('./RepoStateService')
		require('./NotificationService')
	})
}