import * as AppStoreModule from './AppStore'
import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"


const
	log = getLogger(__filename)


export async function storeBuilder(enhancer = null) {
	
	const
		AppStore = require('./AppStore') as typeof AppStoreModule,
		
		store:ObservableStore<any> = ProcessConfig.isStorybook() ?
			(await AppStore.loadAndInitStorybookStore()) :
			(await AppStore.loadAndInitStore(null,enhancer))
				
	
	Container.bind(ObservableStore).provider({ get: () => store})
	log.info(`Built store`)
	return store
}

export default storeBuilder
