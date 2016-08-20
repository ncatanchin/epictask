require('source-map-support').install()


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

// Put lodash on the global scope
global._ = require('lodash')

const isDebug = !_.isNil(process.env.DEBUG)

global.getLogger = function(filename) {
	return ['debug','info','error','warn','trace'].reduce((logger,nextLevel) => {
		const fn = console[nextLevel] ?
			console[nextLevel].bind(console) :
			console.log.bind(console)

		logger[nextLevel] = (...args) => {
			if (nextLevel === 'debug' && !isDebug)
				return
			fn(filename,...args)
		}

		return logger
	},{})

}

