import {ToolPanelLocation, ITool, IToolProps,IToolConfig} from "shared/tools/ToolTypes"
import React from 'react'
const log = getLogger(__filename)

/**
 * Types of Registry
 */
export enum RegistryType {
	Models = 1,
	Tools,
	Views
}

/**
 * Typing for registry
 */
export interface RegistryEntry<T> {
	name:string,
	clazz:T
}


export type TRegistry<T> = {[name:string]: RegistryEntry<T>}

/**
 * Shape of model constructor
 */
export interface IModelConstructor<T> {
	new (...args:any[]):T
	fromJS(o:any):T
}

export interface IToolConstructor extends IToolConfig, React.Component<IToolProps,any> {
	new (...args:any[]):any
	
	
}

export interface IViewConstructor {
	new (...args:any[]):any
}

/**
 * Internal map of all registries
 *
 * @type {{[type:number]:RegistryType}
 */
const registries = {
	[RegistryType.Models]: {} as TRegistry<IModelConstructor<any>>,
	[RegistryType.Tools]: {} as TRegistry<IToolConstructor>,
	[RegistryType.Views]: {} as TRegistry<IViewConstructor>
}

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
export function RegisterModel<T extends IModelConstructor<any>>(target:T) {
	const clazzName = target.name
	log.info(`Registering model: ${clazzName}`)
	registerModel(clazzName,target)

	target.$$clazz = clazzName
	
	return decorateConstructor(function(...args:any[]) {
		target.apply(this,args)
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
 * @param id
 */
export function RegisterTool() {
	return (target:IToolConstructor) => {
		const id = target.id || target.name
		log.info(`Registering tool: ${id}`)
		registerTool(id, target)
	}
}



/**
 * Manual register a clazz
 *
 * @param name
 * @param clazz
 */
function registerTool(name,clazz:IToolConstructor) {
	getRegistry(RegistryType.Tools)[name] = {name,clazz}
}


/**
 * Retrieve the class constructor for a given name
 *
 * @param id
 * @returns {any}
 */
export function getTool(id:string):IToolConstructor {
	const tool = getRegistry(RegistryType.Tools)[id]
	assert(tool,`Tool not found for ${id}`)
	
	return tool.clazz
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