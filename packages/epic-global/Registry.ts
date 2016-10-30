import {ToolPanelLocation, ITool, IToolProps, IToolConfig, IToolRegistration} from "./ToolTypes"

import React from 'react'
import {ActionFactory} from 'typedux'
import { IWindowConfig } from "epic-process-manager-client"
import { decorateConstructor } from "./Decorations"
import { getValue } from "epic-global"


const
	log = getLogger(__filename)
		
//forceReactUpdate = getReactForceUpdate(React);

/**
 * Types of Registry
 */
export enum RegistryType {
	Models = 1,
	Tools,
	Views,
	WindowConfig,
	ActionFactory
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
		
		const
			index = registryListeners.indexOf(listener)
		
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
	name:string
	data?:any
	value?:T
	clazz?:T
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

export interface IActionFactoryConstructor {
	new (...args:any[]):ActionFactory<any,any>
	leaf: string
}

const emptyRegistries = {
	[RegistryType.Models]: {} as TRegistry<IModelConstructor<any>>,
	[RegistryType.Tools]: {} as TRegistry<IToolConstructor>,
	[RegistryType.Views]: {} as TRegistry<IViewConstructor>,
	[RegistryType.WindowConfig]: {} as TRegistry<IWindowConfig>,
	[RegistryType.ActionFactory]: {} as TRegistry<IActionFactoryConstructor>
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

export function RegisterActionFactory(target:IActionFactoryConstructor) {
	getRegistry(RegistryType.ActionFactory)[target.leaf] = {
		name:target.leaf,
		clazz:target
	}
}

/**
 * Auto register a class
 * so it can be dynamically recreated in revivers etc
 *
 * @param target
 */
export function RegisterModel<T extends IModelConstructor<any>>(target:T):T {
	const
		clazzName = target.name
	
	target.$$clazz = clazzName
	
	const
		decoratedClazz = decorateConstructor(function(...args:any[]) {
			target.apply(this,args)
			this.$$clazz = clazzName
		},target) as T
	
	log.info(`Registering model: ${clazzName}`)
	
	
	registerModel(clazzName,decoratedClazz)
	
	return decoratedClazz
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
		const
			id = reg.id || target.name
		
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
	const
		createReactProxy = require('react-proxy').default
	
	try {
		log.info(`Registering ${reg.id}`)
		let
			config = getRegistry(RegistryType.Tools)[reg.id],
			update = false
		
		if (config) {
			update = true
			
			config.data = {
				reg
			}
			config.clazz = clazz
			config.react.getHeaderControls = reg.getHeaderControls
			config.react.proxy.update(clazz)
		} else {
			const
				proxy = createReactProxy(clazz)
			
			config = getRegistry(RegistryType.Tools)[reg.id] = {
				name: reg.id,
				data: {
					reg
				},
				clazz,
				react: {
					proxy,
					proxyComponent: proxy.get(),
					getHeaderControls: reg.getHeaderControls
				}
			}
		}
		//
		// const UIActionFactory = require("shared/actions/ui/UIActionFactory").UIActionFactory as typeof UIActionFactoryType
		// Container.get(UIActionFactory).registerTool(reg as any)
	
		
		//if (update) {
		setImmediate(() =>{
			fireEvent(RegistryEvent.ToolRegistered, reg)
		})
		//}
		
		return config
			.react
			.proxyComponent
		
	} catch (err) {
		log.error(`Failed to register tool`,err)
		require('./NotificationCenter').NotificationCenter.addErrorMessage(err)
		
		return clazz
	}
		
	
}

/**
 * Get a tool config
 *
 * @param id
 * @returns {RegistryEntry<any>}
 */
function getToolConfig(id:string) {
	return getRegistry(RegistryType.Tools)[id]
}

/**
 * get tool registration
 *
 * @param id
 * @returns {IToolRegistration}
 */
function getToolRegistration(id:string):IToolRegistration {
	return getValue(() => getToolConfig(id).data.reg) as IToolRegistration
}

/**
 * Get all tool ids
 *
 * @returns {string[]}
 */
function getToolIds():string[] {
	return Object.keys(getRegistry(RegistryType.Tools))
}

/**
 * Get all tool configs
 *
 * @returns {IToolRegistration[]}
 */
export function getToolRegistrations():IToolConfig[] {
	return getToolIds().map(getToolRegistration)
}


/**
 * Retrieve the class constructor for a given name
 *
 * @param id
 * @returns {any}
 */
export function getToolComponent(id:string):IToolConstructor {
	const
		tool = getToolConfig(id)
	
	assert(tool,`Tool not found for ${id}`)
	
	return tool.clazz// tool.react.proxyComponent
}

/**
 * Get tool component class
 *
 * @param id
 * @returns {any}
 */
export function getToolComponentClass(id:string):IToolConstructor {
	const tool = getToolConfig(id)
	assert(tool,`Tool not found for ${id}`)
	
	return tool.clazz
}

/**
 * Get tool header controls
 *
 * @param id
 * @returns {React.ReactElement<any>[]|Array}
 */
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

/**
 * Get window config registry
 *
 * @returns {TRegistry<IWindowConfig>}
 */
function getWindowConfigRegistry() {
	return getRegistry(RegistryType.WindowConfig) as TRegistry<IWindowConfig>
}

/**
 * Get a window config
 * @param name
 *
 */
export function getWindowConfig(name:string):IWindowConfig {
	const
		entry = getWindowConfigRegistry()[name]
	
	assert(entry,`No window config found for ${name}`)
	return entry.value
}

/**
 * Register a window config
 *
 * @param name
 * @param windowConfig
 */
export function registerWindowConfig(name:string,windowConfig:IWindowConfig) {
	getWindowConfigRegistry()[name] = {
		name,
		value:windowConfig
	}
}

let loaded = false


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

if (DEBUG) {
	Object.assign(global,{
		Registry: module.exports
	})
}