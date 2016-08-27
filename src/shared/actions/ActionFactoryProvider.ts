import {ActionFactory, addActionInterceptor, IActionInterceptorNext} from 'typedux'
import {Container} from 'typescript-ioc'
import {VariableProxy} from 'shared/util/VariableProxy'
import {ProcessType} from "shared/ProcessType"
import {getServerClient} from "shared/server/ServerClient"


const
	log = getLogger(__filename),
	factoryMap:{[key:string]:any} = {},
	proxyMap:any = {}

let actionCtx = null


// If renderer then add an action interceptor
if (!ProcessConfig.isType(ProcessType.StateServer)) {
	//const browserNextTick = require('browser-next-tick')
	
	// Ad the interceptor and keep track of the
	// unregister fn
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



export function getActionFactoryProxyProvider<T extends ActionFactory<any,any>>(name,factory:{new():T}) {
	factoryMap[name] = factory

	return {
		get: () => new (factoryMap[name])()
	}

}


const initActionFactory = (key,mod) => {
	const factory = mod.default
	try {
		const name = key.split('/').pop().split('\.').shift()
		log.info(`Creating and registering action factory '${name}': (isDev=${Env.isDev}) - in dev we return a proxy`)
		new factory()
		if (Env.isDev)
			Container.bind(factory).provider(getActionFactoryProxyProvider(name,factory))
		
	} catch (err) {
		log.error(`Failed to start action factory: ${key}`,err)
		throw err
	}
}

export function loadActionFactories() {
	actionCtx = require.context('shared/actions', true, /ActionFactory\.ts$/)
	actionCtx.keys()
		.filter(key => !/AppActionFactory/.test(key))
		.forEach(key => {
			const mod:any = actionCtx(key)
			initActionFactory(key,mod)
		})

	if (module.hot) {
		module.hot.accept([actionCtx.id],(updates) => {
			log.info('Reloading action factories',updates)
			loadActionFactories()
		})
	}
}