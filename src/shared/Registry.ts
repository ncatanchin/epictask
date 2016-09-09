import {ToolPanelLocation, ITool, IToolProps, IToolConfig, IToolRegistration} from "shared/tools/ToolTypes"
import createReactProxy from 'react-proxy'
import React from 'react'
import {UIActionFactory as UIActionFactoryType} from "shared/actions/ui/UIActionFactory"


const
	log = getLogger(__filename)
		
//forceReactUpdate = getReactForceUpdate(React);

/**
 * Types of Registry
 */
export enum RegistryType {
	Models = 1,
	Tools,
	Views
}

/**
 * Registry events
 */
export enum RegistryEvent {
	ToolRegistered,
	ModelRegistered
}

export type TRegistryListener = (event:RegistryEvent,...args:any[]) => any

 

const registryListeners:TRegistryListener[] = _.get(module,'hot.data.registryListeners',[])

export function addRegistryListener(listener:TRegistryListener) {
	registryListeners.push(listener)
	return function() {
		const index = registryListeners.indexOf(listener)
		if (index > -1) {
			registryListeners.splice(index,1)
		}
	}
}

function fireEvent(event:RegistryEvent,...args:any[]) {
	registryListeners.forEach(listener => {
		try {
			listener(event,...args)
		} catch (err) {
			log.error(`Failed to notify registry listener of ${RegistryEvent[event]}`,err)
		}
	})
}

/**
 * Typing for registry
 */
export interface RegistryEntry<T> {
	name:string,
	clazz:T
	react?:{
		proxyComponent:any
		proxy:any
		getHeaderControls():React.ReactElement<any>[]
	}
	
}


export type TRegistry<T> = {[name:string]: RegistryEntry<T>}

/**
 * Shape of model constructor
 */
export interface IModelConstructor<T> {
	new (...args:any[]):T
	fromJS(o:any):T
}

export interface IToolConstructor extends React.ComponentClass<IToolProps> {
	
	
}

export interface IViewConstructor {
	new (...args:any[]):any
}

const emptyRegistries = {
	[RegistryType.Models]: {} as TRegistry<IModelConstructor<any>>,
	[RegistryType.Tools]: {} as TRegistry<IToolConstructor>,
	[RegistryType.Views]: {} as TRegistry<IViewConstructor>
}
/**
 * Internal map of all registries
 *
 * @type {{[type:number]:RegistryType}
 */
const registries:typeof emptyRegistries = _.get(module,'hot.data.registries',emptyRegistries)



export function getRegistry(type:RegistryType):TRegistry<any> {
	
	const registry = registries[type]
	assert(registry,`Unknown registry type: ${type}`)
	return registry
}

/**
 * Decorate a constructor - ripped from typescript-ioc - many thx ;)
 *
 * @param derived
 * @param base
 * @returns {Function}
 */
function decorateConstructor(derived: Function, base: Function) {
	for (let p of Object.getOwnPropertyNames(base)) {
		if (base.hasOwnProperty(p) && !derived.hasOwnProperty(p)) {
			derived[p] = base[p];
		}
	}
	derived['__parent'] = base;
	function __() { this.constructor = derived; }
	derived.prototype = base === null ? Object.create(base) :
		(__.prototype = base.prototype, new __());
	return derived;
}

/**
 * Auto register a class
 * so it can be dynamically recreated in revivers etc
 *
 * @param target
 */
export function RegisterModel<T extends IModelConstructor<any>>(target:T):T {
	const clazzName = target.name
	log.info(`Registering model: ${clazzName}`)
	registerModel(clazzName,target)

	target.$$clazz = clazzName
	
	return decorateConstructor(function(...args:any[]) {
		target.apply(this,args)
		//super(...args)
		this.$$clazz = clazzName
	},target) as T
}

/**
 * Manual register a clazz
 *
 * @param name
 * @param clazz
 */
function registerModel<T>(name,clazz:IModelConstructor<T>) {
	log.debug(`Adding $$clazz to prototype of ${name}`)
	getRegistry(RegistryType.Models)[name] = {name,clazz}
}


/**
 * Retrieve the class constructor for a given name
 *
 * @param name
 * @returns {any}
 */
export function getModel(name):IModelConstructor<any> {
	const model = getRegistry(RegistryType.Models)[name]
	assert(model, `Model not found for ${name}`)
	
	return model.clazz
}


/**
 * Auto register a tool
 *
 * @param reg
 */
export function RegisterTool(reg:IToolRegistration) {
	return (target:IToolConstructor) => {
		const id = reg.id || target.name
		log.info(`Registering tool: ${id}`)
		return registerTool(reg, target) as any
		
		
	}
}



/**
 * Manual register a clazz
 *
 * @param reg
 * @param clazz
 */
function registerTool(reg:IToolRegistration,clazz:IToolConstructor) {
	try {
		log.info(`Registering ${reg.id}`)
		let config = getRegistry(RegistryType.Tools)[reg.id]
		
		if (config) {
			//log.warn(`HMR is updating mounted instances`)
			config.clazz = clazz
			config.react.getHeaderControls = reg.getHeaderControls
			//config.react.proxyComponent = clazz
			//config.react.proxy.update(clazz)
			config.react.proxy.update(clazz)
			
			
			
			
			//mountedInstances.forEach(forceReactUpdate)
			
		} else {
			const proxy = createReactProxy(clazz)
			getRegistry(RegistryType.Tools)[reg.id] = {
				name: reg.id,
				clazz,
				react: {
					//proxy:null,
					//proxyComponent: clazz,//proxy.get(),
					proxy,
					proxyComponent: proxy.get(),
					getHeaderControls: reg.getHeaderControls
				}
			}
		}
		
		const UIActionFactory = require("shared/actions/ui/UIActionFactory").UIActionFactory as typeof UIActionFactoryType
		Container.get(UIActionFactory).registerTool(reg as any)
	
		
		
		Promise
			.delay(500)
			.then(() => {
				fireEvent(RegistryEvent.ToolRegistered,reg)
				log.info(`Events fired for ${reg.id}`)
				if (config) {
					const
						AppRoot = require('ui/components/root/AppRoot'),
						appInstance = AppRoot.getAppInstance()
					
					if (appInstance)
						require('react-deep-force-update')(appInstance)
				}
			})
		
		return config.react.proxyComponent
	} catch (err) {
		log.error(`Failed to register tool`,err)
		require('shared/Toaster').addErrorMessage(err)
		
		return clazz
	}
		
	
}


function getToolConfig(id:string) {
	loadPlugins()
	
	return getRegistry(RegistryType.Tools)[id]
}

/**
 * Retrieve the class constructor for a given name
 *
 * @param id
 * @returns {any}
 */
export function getToolComponent(id:string):IToolConstructor {
	const tool = getToolConfig(id)
	assert(tool,`Tool not found for ${id}`)
	
	return tool.react.proxyComponent
}

export function getToolComponentClass(id:string):IToolConstructor {
	const tool = getToolConfig(id)
	assert(tool,`Tool not found for ${id}`)
	
	return tool.clazz
}

export function getToolHeaderControls(id:string):React.ReactElement<any>[] {
	const tool = getToolConfig(id)
	assert(tool,`Tool not found for ${id}`)
	
	return tool.react.getHeaderControls ? tool.react.getHeaderControls() : []
}

/**
 * Auto register a view
 *
 * @param id
 */
export function RegisterView(id:string = null) {
	return (target:any) => {
		id = id || target.name
		log.info(`Registering view: ${id}`)
		registerView(id, target)
	}
}



/**
 * Manual register a clazz
 *
 * @param name
 * @param clazz
 */
function registerView(name,clazz:IViewConstructor) {
	getRegistry(RegistryType.Views)[name] = {name,clazz}
}

let loaded = false

/**
 * Load all plugin contexts - only runs once, then monitors in HMR
 */
export function loadPlugins(force = false) {
	if (loaded && !force)
		return
	
	loaded = true
	const contexts = []
	function loadPluginCtx(ctx) {
		contexts.push(ctx)
		ctx.keys().forEach(ctx)
	}
	
	if (typeof window !== 'undefined')
		loadPluginCtx(require.context('ui/plugins/',true))
	
	// if (module.hot) {
	// 	module.hot.accept(contexts.map(ctx => ctx.id), (updates) => {
	// 		log.info('HMR Updates for plugins, reloading plugins', updates)
	// 		loadPlugins(true)
	// 	})
	// }
	
}


/**
 * Retrieve the class constructor for a given name
 *
 * @param id
 * @returns {any}
 */
export function getView(id:string):IViewConstructor {
	const tool = getRegistry(RegistryType.Views)[id]
	assert(tool,`View not found for ${id}`)
	
	return tool.clazz
}

if (module.hot) {
	module.hot.dispose((data:any) => {
		assign(data,{
			registries,
			registryListeners
		})
	})
	module.hot.accept(() => log.info(`HMR update`))
}