///<reference path="../../typings/index.d.ts"/>

/**
 * Grab a ref to global marked as any for augmentation
 *
 * @type {any}
 */
const g = global as any

// LOGGING CONFIG FIRST
require('shared/LogConfig')
import {getLogger as LoggerFactory} from 'typelogger'

// Import everything else
later = require('later/index-browserify')

import './ErrorHandling'
import './util/ObjectUtil'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'
import * as ContextUtils from './util/ContextUtils'
import * as path from 'path'
import * as assertGlobal from 'assert'
import * as LodashGlobal from 'lodash'

// Export globals
const isDev = process.env.NODE_ENV === 'development'
const isRemote = typeof process.env.REMOTE !== 'undefined'
const isOSX = process.platform === 'darwin'
const isRenderer = process.type === 'renderer'


const envName =  LodashGlobal.toLower(process.env.NODE_ENV || (isDev ? 'dev' : 'production'))

const EnvGlobal = {
	envName,
	isOSX,
	isDev,
	isDebug: DEBUG && isDev,
	isHot: !LodashGlobal.isNil(process.env.HOT),
	isRemote,
	isRenderer,
	isMain: !isRenderer,
	baseDir: path.resolve(__dirname,'../..')
}

// Polyfill Fetch/FormData/etc
function installGlobals() {
	const w = ((typeof window !== 'undefined') ? window : {}) as any
	if (!g.fetch) g.fetch = require('node-fetch')
	if (!g.FormData) g.FormData = require('form-data')
	if (!g.TextEncoder) {
		const te = require("utf8-encoding/utf8-encoding.js");
		g.TextEncoder = te.TextEncoder;
		g.TextDecoder = te.TextDecoder;

	}

	if (!w.TextEncoder) {
		w.TextEncoder = g.TextEncoder
		w.TextDecoder = g.TextDecoder
	}

	// Assign all of our internal globals
	Object.assign(g, {
		Immutable: ImmutableGlobal,
		TypeMutant: TypeMutantGlobal,
		_: LodashGlobal,
		assert: assertGlobal,
		Env: EnvGlobal
	}, ContextUtils)
}


/**
 * Declare globals
 *
 * @global getLogger
 */

declare global {

	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var assert:typeof assertGlobal
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var getLogger:typeof LoggerFactory
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Immutable:typeof ImmutableGlobal
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var TypeMutant:typeof TypeMutantGlobal
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var requireContext:typeof ContextUtils.requireContext
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var mergeContext:typeof ContextUtils.mergeContext
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var _:typeof LodashGlobal & LodashMixins
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Env:typeof EnvGlobal
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var MainBooted:boolean
}




installGlobals()


export {}
