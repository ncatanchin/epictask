const Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: true
})

Promise = Bluebird

export = Bluebird