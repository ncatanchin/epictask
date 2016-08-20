import {ActionFactory} from 'typedux'
import {Container} from 'typescript-ioc'
import {VariableProxy} from 'shared/util/VariableProxy'


const log = getLogger(__filename)

const factoryMap:{[key:string]:any} = {}
const proxyMap:any = {}

let actionCtx = null

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