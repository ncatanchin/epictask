
import {List,Map} from 'immutable'
import "./WindowTypes"

import Electron from 'epic-electron'

import LodashGlobal from './LoDashMixins'

// IOC CONTAINER
import {Container as ContainerGlobal} from 'typescript-ioc'

// PROCESS CONFIG
import './ProcessConfig'

// LOGGING CONFIG FIRST
import './LogConfig'

import {LogLevel as LogLevelGlobal} from 'typelogger'

// LATER - POOR TYPING
later = require('later/index-browserify')

import {NotificationCenter,getNotificationCenter} from './NotificationCenter'

// Export globals
const
	_ = require('lodash'),
	g = global as any

_.assignGlobal({
	getNotificationCenter
})



import './ErrorHandling'

import * as ImmutableGlobal from 'immutable'
import {Map as MapGlobal,List as ListGlobal,Record as RecordGlobal} from 'immutable'

import * as momentGlobal from 'moment'

const
	momentMod = require('moment'),
	momentExport = [momentMod,momentMod.default,momentGlobal]
		.find(it => _.isFunction(it))

import ReactGlobal from 'react'
import ReactDOMGlobal from 'react-dom'

import JQueryGlobal from 'jquery'
import RadiumGlobal from 'radium'

import EventHub,{TEventHub} from  './EventHub'
import * as Constants from 'epic-global/Constants'
import { EventType } from "epic-global/Constants"

// ADD EVENTS TO GLOBAL
_.assignGlobal({
	Constants
})


/**
 * Global function for retrieving the child window id
 *
 * @returns {null}
 */
function getWindowIdGlobal():string {
	return !Electron.remote ? 'main' : `${Electron.remote.getCurrentWindow().id}`
}

/**
 * Retrieve a formatted process identifier - NOT A PID
 *
 * @returns {string}
 */
function getProcessId() {
	const
		windowId = getWindowIdGlobal(),
		windowIdStr = !windowId ? '' : `-${windowId}`
	
	return  `${ProcessConfig.getTypeName()}${windowIdStr}`
}

/**
 * Finds the current window from anywhere
 *
 * @param flushCache
 *
 * @returns {Electron.BrowserWindow}
 */
function getCurrentWindowGlobal(flushCache = false):Electron.BrowserWindow {
	if (flushCache) {
		try {
			delete require.cache[require.resolve('electron')]
		} catch (err) {
			console.warn(`failed to clear electron from cache`, err)
		}
	}
	try {
		
		let
			Electron = require('electron')
		
		try {
			return Env.isMain ?
				Electron.BrowserWindow.getFocusedWindow() :
				Electron.remote.getCurrentWindow()
				
			
		} catch (err) {
			console.error(`Failed to get current window`,err)
			return null
			// if (!flushCache)
			// 	return getCurrentWindowGlobal(true)
			// else
			//	return (Electron.remote || Electron).BrowserWindow.getFocusedWindow()
		}
	} catch (err) {
		console.error(`Unable to find any current window`,err)
		return null
	}
}

/**
 * Install polyfills & global objects
 *
 */
function installGlobals() {
	
	const
		win = ((typeof window !== 'undefined') ? window : {}) as any,
		
		// TEXT ENCODER POLYFILL
		textEncoderPolyFill = () => _.pick(
			require("utf8-encoding/utf8-encoding.js"),
			'TextEncoder',
			'TextDecoder'
		)
	
	
	if (!g.TextEncoder)
		_.assign(g,textEncoderPolyFill())
	

	if (!win.TextEncoder)
		_.assign(win,textEncoderPolyFill())
	
	
	

	// Assign all of our internal globals
	Object.assign(g, {
		fetch: g.fetch || require('node-fetch'),
		FormData: g.FormData || require('form-data'),
		Immutable: ImmutableGlobal,
		M: MapGlobal,
		L: ListGlobal,
		moment: momentExport,
		//moment: momentGlobal,
		Map:MapGlobal,
		List:ListGlobal,
		Record:RecordGlobal,
		_: LodashGlobal,
		LogLevel: LogLevelGlobal,
		assert: (test,msg) => {
			if (!test)
				throw new Error(msg)
		},
		
		Container: ContainerGlobal,
		assign: Object.assign.bind(Object),
		assignGlobal: _.assignGlobal.bind(_),
		EventHub,
		isShuttingDown() {
			return Env.isMain ?
				(global as any).shutdownInProgress :
				require('electron').remote.getGlobal('shutdownInProgress')
		},
		setStoreReady(ready:boolean) {
			g.GlobalStoreReady = true
			
			if (isStoreReady()) {
				EventHub.emit(EventType.StoreReady)
			}
		},
		isStoreReady() {
			return g.GlobalStoreReady === true
		},
		getAppConfig: require('./AppConfig').getAppConfig,
		node_require: __non_webpack_require__,
		
		
		getWindowId: getWindowIdGlobal,
		getProcessId,
		getCurrentWindow: getCurrentWindowGlobal
	})
}



installGlobals()

export {}

if (module.hot) {
	module.hot.accept()
}





/**
 * Declare globals
 *
 * @global getLogger
 */

declare global {
	interface IAssignGlobal {
		(...sources:any[]):any
	}
	
	
	// interface Map<K,V> extends Immutable.Map<K,V> {
	//
	// }
	//
	// interface MapConstructor  {
	// 	<K,V>(entries?: any):Immutable.Map<K,V>
	// 	(entries?: any):Immutable.Map<any,any>
	//
	// 	isMap(maybeMap: any): boolean;
	//
	// 	<K, V>(): Immutable.Map<K, V>;
	// 	<K, V>(iter: Immutable.Iterable.Keyed<K, V>): Immutable.Map<K, V>;
	// 	<K, V>(iter: Immutable.Iterable<any, /*[K,V]*/Array<any>>): Immutable.Map<K, V>;
	// 	<K, V>(array: Array</*[K,V]*/Array<any>>): Immutable.Map<K, V>;
	// 	<V>(obj: {[key: string]: V}): Immutable.Map<string, V>;
	// 	<K, V>(iterator: Immutable.Iterator</*[K,V]*/Array<any>>): Immutable.Map<K, V>;
	// 	<K, V>(iterable: /*Iterable<[K,V]>*/Object): Immutable.Map<K, V>;
	// 	/**
	// 	 * Creates a new Map from alternating keys and values
	// 	 */
	// 		of(...keyValues: any[]): Immutable.Map<any, any>;
	// }

	function isShuttingDown():boolean
	let shutdownInProgress:boolean
	
	// GLOBAL WHEN RUNNING STANDALONE
	let __NO_WEBPACK__:boolean
	
	// POLYFILL REQUIRE
	function polyfillRequire(r:any)
	
	
	function getWindowId():string
	function getProcessId():string
	
	function isStoreReady():boolean
	function setStoreReady(ready:boolean)
	
	var EventHub:TEventHub
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var LogLevel:typeof LogLevelGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Container:typeof ContainerGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	function assert(test:any,msg?:string)
	
	
	// var M:typeof Immutable.Map
	// var L:typeof Immutable.List
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	//var Immutable:typeof ImmutableGlobal
	
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var _:typeof LodashGlobal
	
	function getCurrentWindow():Electron.BrowserWindow
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var MainBooted:boolean
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assign:typeof Object.assign
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assignGlobal:IAssignGlobal
	
	interface IAssignGlobal {
		(...sources:any[]):any
	}
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var node_require:typeof __non_webpack_require__
	
	
	var moment:typeof momentGlobal
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
	var Notification:any
	var $:typeof JQueryGlobal
	//var logError:typeof logErrorGlobal
	
	var Radium:typeof RadiumGlobal
	
	interface Window {
		$:typeof JQueryGlobal
		dialogName:string
	}
	
	interface Object {
		// Class name
		$$clazz?:string
		
		// Used internally to clear state of typestore/pouch objects
		$$docs?:any
	}
	
	
	
}