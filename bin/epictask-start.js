require('source-map-support').install()
require('babel-polyfill')

/**
 * Replace es6-promise with bluebird
 */
const Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: true,
	monitoring: true
})

global.Promise = Bluebird
require('babel-runtime/core-js/promise').default = Bluebird


/**
 * No load the main entry
 */
require('../dist/MainEntry')