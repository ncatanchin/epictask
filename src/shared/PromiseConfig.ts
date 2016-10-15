import * as Bluebird from 'bluebird'// = require('bluebird')

declare global {
	var Promise:typeof Bluebird
	
	interface CancelablePromiseResolver extends Promise.Resolver<any> {
		isCancelled():boolean
		cancel():void
		onCancel(cancelCallback:(CancelablePromiseResolver) => any):void
	}
	
	interface PromiseConstructor {
		setImmediate():Promise<void>
		defer():CancelablePromiseResolver
	}
	
}

require('babel-runtime/core-js/promise').default = Bluebird

Bluebird.config({
	cancellation: true,
	//longStackTraces: true,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: true
})

Object.assign(Bluebird as any, {
	defer() {
		let
			resolve,
			reject,
			onCancel,
			ref,
			cancelled = false,
			cancelCallbacks = []
		
		const promise = new Promise(function (resolver, rejecter, onCancelRegistrar) {
			resolve = resolver
			reject = rejecter
			onCancel = onCancelRegistrar
			
			onCancel(() => {
				cancelled = true
				cancelCallbacks.forEach(it => it(ref))
			})
		});
		
		ref = {
			resolve: resolve,
			reject: reject,
			cancel: () => {
				!cancelled && !promise.isResolved() && !promise.isRejected() &&
				promise.cancel()
			},
			promise: promise,
			isCancelled: () => cancelled,
			onCancel: (callback) => cancelCallbacks.push(callback)
		}
		
		return ref
	}
})

Object.assign(global as any, {
	Promise: Bluebird
})

Promise.setImmediate = function () {
	return new Promise<void>(resolve => {
		setImmediate(() => resolve())
	})
}


export default Promise