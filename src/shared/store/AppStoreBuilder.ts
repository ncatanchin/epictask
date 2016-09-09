import {loadAndInitStore as loadAndInitStoreType} from 'shared/store'
import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"

const log = getLogger(__filename)

// For dev/hot load
let storeEnhancerRef = null

export async function storeBuilder(storeEnhancer = null) {
	storeEnhancerRef = storeEnhancer
	
	const
		loadAndInitStore = require('shared/store/AppStore').loadAndInitStore as typeof loadAndInitStoreType,
		store:ObservableStore<any> = await loadAndInitStore(storeEnhancer)
	
	Container.bind(ObservableStore).provider({ get: () => store})
	
	return store
}

export default storeBuilder
//
// if (module.hot) {
// 	module.hot.accept(['shared/store/AppStore'], () => {
// 		log.warn('AppStore - ignored')
// 		storeBuilder(storeEnhancerRef)
// 	})
// }