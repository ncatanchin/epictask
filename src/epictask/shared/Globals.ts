
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
import {getLogger as LoggerFactory} from 'typelogger'

// OVERRIDE PROMISE - FIRST
const Bluebird = require('./PromiseConfig')

Promise = Bluebird

// Import everything else
later = require('later/index-browserify')


import './ErrorHandling'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'
import * as LodashGlobal from 'lodash'
import * as ContextUtils from './util/ContextUtils'
import './util/ObjectUtil'
import * as assertGlobal from 'assert'

/**
 * Declare globals
 *
 * @global getLogger
 */
declare global {
	var assert:typeof assertGlobal
	var getLogger:typeof LoggerFactory
	var Immutable:typeof ImmutableGlobal
	var TypeMutant:typeof TypeMutantGlobal
	var requireContext:typeof ContextUtils.requireContext
	var mergeContext:typeof ContextUtils.mergeContext
	var _:typeof LodashGlobal & LodashMixins
	var Env:any
}

// Export globals
const isDev = process.env.NODE_ENV === 'development'
const isRemote = typeof process.env.REMOTE !== 'undefined'
const isOSX = process.platform === 'darwin'

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
		assert:assertGlobal,
		Env: {
			isOSX,
			isDev,
			isDebug: DEBUG && isDev,
			isHot: !LodashGlobal.isNil(process.env.HOT),
			isRemote
		}
	},ContextUtils)
}

installGlobals()


export { }
