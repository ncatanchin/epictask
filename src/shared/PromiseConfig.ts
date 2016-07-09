import * as Bluebird from 'bluebird'// = require('bluebird')

declare global {
	var Promise:typeof Bluebird
}

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: true
})

Object.assign(global as any,{
	Promise:Bluebird
})

export {

}