import * as Bluebird from 'bluebird'// = require('bluebird')

declare global {
	var Promise:typeof Bluebird

	interface PromiseConstructor {
		setImmediate():Promise<void>
		defer():Promise.Resolver<any>
	}
	
}

require('babel-runtime/core-js/promise').default = Bluebird

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: true
})

Object.assign(Bluebird as any, {
	defer() {
		let resolve, reject;
		const promise = new Promise(function () {
			resolve = arguments[0];
			reject = arguments[1];
		});
		return {
			resolve: resolve,
			reject: reject,
			promise: promise
		};
	}
})

Object.assign(global as any,{
	Promise:Bluebird
})

Promise.setImmediate = function() {
	return new Promise<void>(resolve => {
		setImmediate(() => resolve())
	})
}



export default Promise