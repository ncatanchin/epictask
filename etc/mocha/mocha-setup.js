require('source-map-support').install()


// const Module = require('module')
// if (Module.globalPaths)
// 	Module.globalPaths.push(process.cwd() + '/target/ts/src')
//
// global.DEBUG = true
// process.env.NODE_ENV = process.env.NODE_ENV || 'development'
// process.env.NODE_PATH += `:${process.cwd()}/target/ts/src:${process.cwd()}/target/ts/libs`

//require('../packages-path')

global.Promise = require('bluebird')

Promise.config({
	cancellation: true,
	longStackTraces: true,
	warnings: true,
	monitoring: false
})

require('babel-runtime/core-js/promise').default = Promise
require("babel-polyfill")
require('expectations')
require('reflect-metadata')

// var Log = require('typestore').Log

// if (!process.env.DEBUG)
//  	Log.setLogThreshold(Log.LogLevel.DEBUG)

global.getLogger = function(filename) {
	return ['debug','info','error','warn','trace'].reduce((logger,nextLevel) => {
		const fn = console[nextLevel] ?
			console[nextLevel].bind(console) :
			console.log.bind(console)

		logger[nextLevel] = (...args) => {
			fn(filename,...args)
		}

		return logger
	},{})

}


//global.Promise = global.BBPromise = require('../../packages/typestore/dist/Promise')
//global.assert = require('assert')