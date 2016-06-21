const Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: true,
	monitoring: true
})

Promise = Bluebird

export = Bluebird