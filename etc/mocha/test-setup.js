//require('source-map-support').install()
global.Promise = require('bluebird')

Promise.config({
	cancellation: true,
	longStackTraces: true,
	warnings: true,
	monitoring: true
})

require('babel-runtime/core-js/promise').default = Promise
require("babel-polyfill")
require('reflect-metadata')

global._ = require('epic-entry-shared/LoDashMixins')._

const
	isDebug = !_.isNil(process.env.DEBUG)

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

global.__non_webpack_require__ = require
global.DEBUG = true
require('epic-entry-shared/ProcessConfig')
ProcessConfig.setType(ProcessType.Test)



//jest.mock('epic-entry-shared/LogConfig')



