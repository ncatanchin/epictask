import 'shared/ProcessConfig'
import 'shared/NamespaceConfig'
import 'reflect-metadata'
import 'shared/LogConfig'

import 'shared/RendererLogging'
import 'shared/PromiseConfig'

// Load all global/env stuff first
import './UIGlobals'

// Set process type
ProcessConfig.setType(ProcessConfig.Type.UI)

if (Env.isDev && !Env.isTest) {
	require('./UIDevConfig')
}



const
	log = getLogger(__filename),
	loadUI = () => require('./UIConfigurator')

loadUI()

if (module.hot) {
	module.hot.accept('./UIConfigurator',() => {
		log.info('Hot Reloading configurator')
		loadUI()
	})
	module.hot.accept(() => log.info(`hot reload`,__filename))
	
}