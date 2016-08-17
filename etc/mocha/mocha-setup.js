//require('source-map-support').install()
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