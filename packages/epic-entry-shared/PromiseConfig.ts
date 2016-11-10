import * as Bluebird from 'bluebird'// = require('bluebird')

/**
 * Update Babel Runtime
 *
 * @type {PromiseConstructor|Promise}
 */
require('babel-runtime/core-js/promise').default = Bluebird

Object.assign(global as any,{
	Promise: Bluebird
})

/**
 * Configure
 */
const
	{env} = process

env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'
if (!env.NODE_ENV) {
	env.NODE_ENV = 'production'
}

/**
 * CONFIGURE PROMISES FIRST
 */

Bluebird.config({
	cancellation: true,
	longStackTraces: env.NODE_ENV === 'development',
	warnings: {
		wForgottenReturn: false
	},
	monitoring: env.NODE_ENV === 'development'
})

// ORIGINAL PROMISE CONFIG
// Bluebird.config({
// 	cancellation: true,
// 	//longStackTraces: true,
// 	warnings: {
// 		wForgottenReturn: false
// 	},
// 	monitoring: true
// })

/**
 * Update global promise definition
 */
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


/**
 * Extend bluebird with custom defer() and setImmediate
 */
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
	},
	
	setImmediate: function () {
		return new Promise<void>(resolve => {
			setImmediate(() => resolve())
		})
	}
})



export {
	Bluebird
}

export default Bluebird