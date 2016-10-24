import Electron = require('electron')
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
//import {getValue} from  "epic-common"

import * as ImmutableGlobal from 'immutable'
import {Map as MapGlobal,List as ListGlobal,Record as RecordGlobal} from 'immutable'

import * as ContextUtils from './ContextUtils'
import * as assertGlobal from 'assert'
import * as LodashGlobal from 'lodash'

import * as ReactGlobal from 'react'
import * as ReactDOMGlobal from 'react-dom'

import * as JQueryGlobal from 'jquery'
import * as RadiumGlobal from 'radium'


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
		Map:MapGlobal,
		List:ListGlobal,
		Record:RecordGlobal,
		_: LodashGlobal,
		LogLevel: LogLevelGlobal,
		moment: require('moment'),
		assert: assertGlobal,
		Container: ContainerGlobal,
		assign: Object.assign.bind(Object),
		assignGlobal: _.assignGlobal.bind(_),
		node_require: __non_webpack_require__,
		getChildWindowId: getChildWindowIdGlobal,
		getCurrentWindow: getCurrentWindowGlobal
	}, ContextUtils)
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
	
	var getChildWindowId:typeof getChildWindowIdGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var LogLevel:typeof LogLevelGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Container:typeof ContainerGlobal

	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assert:typeof assertGlobal
	
	
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Immutable:typeof ImmutableGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var requireContext:typeof ContextUtils.requireContext
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var mergeContext:typeof ContextUtils.mergeContext
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var _:typeof LodashGlobal
	
	let getCurrentWindow:typeof getCurrentWindowGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var MainBooted:boolean
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assign:typeof Object.assign
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assignGlobal:IAssignGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var node_require:typeof __non_webpack_require__
	
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
	var Notification:any
	//var logError:typeof logErrorGlobal
	var $:typeof JQueryGlobal
	var Radium:typeof RadiumGlobal
	
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

installGlobals()

export {}

if (module.hot) {
	module.hot.accept()
}