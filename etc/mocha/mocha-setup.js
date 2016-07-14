//require('source-map-support').install()
//require('../packages-path')
require('bluebird').config({
	cancellation: true,
	longStackTraces: true,
	warnings: true,
	monitoring: false
})
require("babel-polyfill")
require('expectations')
require('reflect-metadata')

// var Log = require('typestore').Log

// if (!process.env.DEBUG)
// 	Log.setLogThreshold(Log.LogLevel.WARN)

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