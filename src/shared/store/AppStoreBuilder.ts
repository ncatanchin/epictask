import {loadAndInitStore as loadAndInitStoreType} from 'shared/store'
import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"

const log = getLogger(__filename)


export async function storeBuilder() {
	const
		loadAndInitStore = require('shared/store/AppStore').loadAndInitStore as typeof loadAndInitStoreType,
		store:ObservableStore<any> = await loadAndInitStore()
	
	Container.bind(ObservableStore).provider({ get: () => store})
	log.info(`Built store`)
	return store
}

export default storeBuilder
