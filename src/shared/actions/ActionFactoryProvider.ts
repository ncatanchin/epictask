import {addActionInterceptor, IActionInterceptorNext} from 'typedux'
import {ProcessType} from "shared/ProcessType"
import {getServerClient} from "shared/server/ServerClient"


const
	log = getLogger(__filename),
	factoryMap:{[key:string]:any} = {},
	proxyMap:any = {}

let actionCtx = null


// If renderer then add an action interceptor
if (!ProcessConfig.isType(ProcessType.StateServer)) {
	const unregisterInterceptor = addActionInterceptor(
		({leaf,type,options}, next:IActionInterceptorNext, ...args:any[]) => {
			
			// Push it to the server
			getServerClient().sendAction(leaf,type,...args)
			
			// If it's a reducer then process it, otherwise - wait for server
			// to process the action and send data
			return (options && options.isReducer) ? next() : null
		}
	)
	
	if (module.hot) {
		module.hot.dispose(() => {
			log.info(`HMR Removing action interceptor`)
			unregisterInterceptor()
		})
	}
}



const initActionFactory = (key,mod) => {
	// const factory = mod.default
	// try {
	// 	const name = key.split('/').pop().split('\.').shift()
	// 	log.info(`Creating and registering action factory '${name}': (isDev=${Env.isDev}) - in dev we return a proxy`)
	// 	new factory()
	// 	// if (Env.isDev)
	// 	// 	Container.bind(factory).provider(getActionFactoryProxyProvider(name,factory))
	// 	//
	// } catch (err) {
	// 	log.error(`Failed to start action factory: ${key}`,err)
	// 	throw err
	// }
}

export function loadActionFactories() {
	actionCtx = require.context('shared/actions', true, /ActionFactory\.ts$/)
	actionCtx.keys()
		//.filter(key => key.indexOf('AppActionFactory') === -1)
		.forEach(actionCtx)

	// if (module.hot) {
	// 	module.hot.accept([actionCtx.id],(updates) => {
	// 		log.info('Reloading action factories',updates)
	// 		loadActionFactories()
	// 	})
	// }
}