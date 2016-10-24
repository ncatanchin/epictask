import * as AppStoreModule from './AppStore'
import {ObservableStore} from 'typedux'
import {Container} from "typescript-ioc"

const log = getLogger(__filename)


export async function storeBuilder() {
	const
		AppStore = require('./AppStore') as typeof AppStoreModule,
		
		store:ObservableStore<any> = ProcessConfig.isType(ProcessType.UI) ?
			(await AppStore.loadAndInitStore()) :
			ProcessConfig.isType(ProcessType.UIChildWindow) ?
				(await AppStore.loadAndInitChildStore()) :
				(await AppStore.loadAndInitStorybookStore())
	
	Container.bind(ObservableStore).provider({ get: () => store})
	log.info(`Built store`)
	return store
}

export default storeBuilder
