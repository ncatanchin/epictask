// IOC CONTAINER
import {Container as ContainerGlobal} from 'typescript-ioc'

// PROCESS CONFIG
import 'shared/ProcessConfig'

// LOGGING CONFIG FIRST
import 'shared/LogConfig'

import {LogLevel as LogLevelGlobal} from 'typelogger'

// LATER - POOR TYPING
later = require('later/index-browserify')

import 'shared/ErrorHandling'
import 'shared/util/ObjectUtil'
import * as ImmutableGlobal from 'immutable'
import {Map as MapGlobal,List as ListGlobal,Record as RecordGlobal} from 'immutable'
import * as ContextUtils from './util/ContextUtils'
import * as assertGlobal from 'assert'
import * as LodashGlobal from 'lodash'
import EnvGlobal from 'shared/Env'
import { acceptHot } from "shared/util/HotUtils"


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
		assert: assertGlobal,
		Env: EnvGlobal,
		Container: ContainerGlobal,
		assign: Object.assign.bind(Object),
		assignGlobal: _.assignGlobal.bind(_),
		getChildWindowId: getChildWindowIdGlobal
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
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Env:typeof EnvGlobal
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var MainBooted:boolean
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assign:typeof Object.assign
	
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assignGlobal:IAssignGlobal
	
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

acceptHot(module)