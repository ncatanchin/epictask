import "epic-entry-shared/AppEntry"

// //require('source-map-support').install()
// const Promise = require('../../node_modules/bluebird')
// //global.Promise = require('bluebird')
//
// Promise.config({
// 	cancellation: true,
// 	longStackTraces: true,
// 	warnings: true,
// 	monitoring: true
// })
//
// require('babel-runtime/core-js/promise').default = Promise
// require("babel-polyfill")
// require('reflect-metadata')

global._ = require('epic-entry-shared/LoDashMixins').default
global.assert =  (test,msg) => {
	if (!test)
		throw new Error(msg)
}
const
	isDebug = !_.isNil(process.env.DEBUG)

global.getLogger = function(filename) {
	console.log(`Creating logger ${filename}`)
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

global.__non_webpack_require__ = require
global.DEBUG = true
require('epic-entry-shared/ProcessConfig')
ProcessConfig.setType(ProcessType.Test)



//jest.mock('epic-entry-shared/LogConfig')



