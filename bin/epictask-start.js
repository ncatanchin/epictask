
const electron = require('electron')
const proc = require('child_process')

proc.spawn(electron)
//require('source-map-support').install()
//require('source-map-support/register')

// console.log('starting epictask: ' + process.cwd())
// require('babel-polyfill')
//
// process.env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'
//
// /**
//  * Replace es6-promise with bluebird
//  */
// const Bluebird = require('bluebird')
//
// Bluebird.config({
// 	cancellation: true,
// 	longStackTraces: true,
// 	warnings: {
// 		wForgottenReturn: false
// 	},
// 	monitoring: true
// })
//
// //global.Promise = Bluebird
// require('babel-runtime/core-js/promise').default = Bluebird


/**
 * No load the main entry
 */

//require('../dist/MainEntry')
