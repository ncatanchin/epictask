import './GlobalDeclarations'

import Electron = require('electron')

import './LoDashMixins'

// IOC CONTAINER
import {Container as ContainerGlobal} from 'typescript-ioc'

// PROCESS CONFIG
import './ProcessConfig'

// LOGGING CONFIG FIRST
import './LogConfig'

import {LogLevel as LogLevelGlobal} from 'typelogger'

// LATER - POOR TYPING
later = require('later/index-browserify')

import './ErrorHandling'

//import {getValue} from  "epic-global"

import * as ImmutableGlobal from 'immutable'
import {Map as MapGlobal,List as ListGlobal,Record as RecordGlobal} from 'immutable'

import * as assertGlobal from 'assert'
import * as LodashGlobal from 'lodash'

import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'

import * as JQueryGlobal from 'jquery'
import * as RadiumGlobal from 'radium'

import {getNotificationCenter as getNotificationCenterGlobal} from 'epic-global/NotificationCenter'

// Export globals
const
	_ = require('lodash'),
	g = global as any


/**
 * Global function for retrieving the child window id
 *
 * @returns {null}
 */
function getChildWindowIdGlobal() {
	const
		windowId = process.env.EPIC_WINDOW_ID
	return  windowId && windowId !== 'undefined' ? windowId : null
}


/**
 * Finds the current window from anywhere
 * @returns {Electron.BrowserWindow}
 */
function getCurrentWindowGlobal():Electron.BrowserWindow {
	try {
		const
			Electron = require('electron')
		try {
			return Electron.remote.getCurrentWindow()
		} catch (err) {
			return Electron.BrowserWindow.getFocusedWindow()
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
		Map:MapGlobal,
		List:ListGlobal,
		Record:RecordGlobal,
		_: LodashGlobal,
		LogLevel: LogLevelGlobal,
		moment: require('moment'),
		assert: assertGlobal,
		
		getNotificationCenter: getNotificationCenterGlobal,
		
		Container: ContainerGlobal,
		assign: Object.assign.bind(Object),
		assignGlobal: _.assignGlobal.bind(_),
		getAppConfig: require('./AppConfig').getAppConfig,
		node_require: __non_webpack_require__,
		getChildWindowId: getChildWindowIdGlobal,
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
	
	
	
	let getChildWindowId:typeof getChildWindowIdGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let LogLevel:typeof LogLevelGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let Container:typeof ContainerGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let assert:typeof assertGlobal
	
	let M:typeof Immutable.Map
	let L:typeof Immutable.List
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let Immutable:typeof ImmutableGlobal
	
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var _:typeof LodashGlobal
	
	let getCurrentWindow:typeof getCurrentWindowGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let MainBooted:boolean
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let assign:typeof Object.assign
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let assignGlobal:IAssignGlobal
	
	let getNotificationCenter:typeof getNotificationCenterGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	let node_require:typeof __non_webpack_require__
	
	let React:typeof ReactGlobal
	let ReactDOM:typeof ReactDOMGlobal
	let Notification:any
	//var logError:typeof logErrorGlobal
	var $:typeof JQueryGlobal
	let Radium:typeof RadiumGlobal
	
	interface Window {
		$:typeof JQueryGlobal
		dialogName:string
	}
	
	/**
	 * Extending root types with some custom props
	 */
	interface Object {
		
		// Class name
		$$clazz?:string
		
		// Used internally to clear state of typestore/pouch objects
		$$docs?:any
	}
}