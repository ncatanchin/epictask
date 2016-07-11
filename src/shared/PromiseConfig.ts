import * as Bluebird from 'bluebird'// = require('bluebird')

declare global {
	var Promise:typeof Bluebird

	interface PromiseConstructor {
		setImmediate():Promise<void>
	}
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

Promise.setImmediate = function() {
	return new Promise<void>(resolve => {
		setImmediate(() => resolve())
	})
}

export {

}