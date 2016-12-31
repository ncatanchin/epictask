

const
	log = getLogger(__filename)

import './DatabaseClientService'
import './AppStateService'
import './UIStateService'
import './RepoStateService'
import './NotificationService'
import './NotificationUIService'
import './SoundFXService'

if (module.hot) {
	module.hot.accept([
		'./DatabaseClientService',
		'./AppStateService',
		'./UIStateService',
		'./RepoStateService',
		'./NotificationUIService',
		'./NotificationService',
		'./SoundFXService'
	],(updates) => {
		
		log.info(`HMR Updates`,updates)
		
		require('./DatabaseClientService')
		require('./AppStateService')
		require('./UIStateService')
		require('./RepoStateService')
		require('./NotificationService')
		require('./NotificationUIService')
		require('./SoundFXService')
	})
}