/**
 * Install source map support with a custom handler
 * for NON absolute paths
 */
require('source-map-support').install({
	retrieveSourceMap(source) {
		if (/^(\/|\.|http|file)/.test(source)) {
			return null
		}

		return {map:{
			version: 3,
			file: "null.js.map",
			sources: [],
			sourceRoot: "/",
			names: [],
			mappings: ""
		}}
	}
})

/**
 * Grab a ref to global marked as any for augmentation
 * 
 * @type {any}
 */
const g = global as any

/**
 * Replace es6-promise with bluebird
 * 
 * @type {any|"~bluebird/bluebird".Bluebird}
 */
require('babel-runtime/core-js/promise').default = require('bluebird')

// LOGGING CONFIG FIRST
Object.assign(global as any,{
	TypeLoggerCategories: require('epictask/shared/LogCategories'),
	TypeLoggerDefaultLevel: 3
})


// Now everything else
import 'reflect-metadata'
import {getLogger as LoggerFactory} from 'typelogger'

// OVERRIDE PROMISE - FIRST
const Bluebird = require('./PromiseConfig')

Promise = Bluebird

// Import everything else
import './ErrorHandling'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'
import * as LodashGlobal from 'lodash'
import * as ContextUtils from './util/ContextUtils'


/**
 * Declare globals
 *
 * @global getLogger
 */
declare global {
	var getLogger:typeof LoggerFactory
	var Immutable:typeof ImmutableGlobal
	var TypeMutant:typeof TypeMutantGlobal
	var requireContext:typeof ContextUtils.requireContext
	var mergeContext:typeof ContextUtils.mergeContext
	var _:typeof LodashGlobal
	var Env:any
}

// Export globals
const isDev = process.env.NODE_ENV === 'development'
const isRemote = typeof process.env.REMOTE !== 'undefined'

// Polyfill Fetch/FormData/etc
function installGlobals() {
	const w = ((typeof window !== 'undefined') ? window : {}) as any
	if (!g.fetch) g.fetch = require('node-fetch')
	if (!g.FormData) g.FormData = require('form-data')
	if (!g.TextEncoder) {
		const te = require("utf8-encoding");
		g.TextEncoder = te.TextEncoder;
		g.TextDecoder = te.TextDecoder;

	}

	if (!w.TextEncoder) {
		w.TextEncoder = g.TextEncoder
		w.TextDecoder = g.TextDecoder
	}

	// Assign all of our internal globals
	Object.assign(g,{
		Immutable: ImmutableGlobal,
		TypeMutant: TypeMutantGlobal,
		_:LodashGlobal,
		Promise:Bluebird,
		Env: {
			isDev,
			isDebug: DEBUG && isDev,
			isHot: !LodashGlobal.isNil(process.env.HOT),
			isRemote
		}
	},ContextUtils)
}

installGlobals()


export { }
