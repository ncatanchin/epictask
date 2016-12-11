import * as Bluebird from 'bluebird'

/**
 * Update Babel Runtime
 *
 * @type {PromiseConstructor|Promise}
 */
require('babel-runtime/core-js/promise').default = Bluebird

Object.assign(global as any,{
	Promise: Bluebird
})

// /**
//  * Configure
//  */
// const
// 	{env} = process
//
// env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'
// env.BLUEBIRD_DEBUG = '0'
//
// if (!env.NODE_ENV) {
// 	env.NODE_ENV = 'production'
// }

/**
 * CONFIGURE PROMISES FIRST
 */

Bluebird.config({
	cancellation: true,
	longStackTraces: process.env.NODE_ENV === 'development',
	warnings: {
		wForgottenReturn: false
	},
	monitoring: process.env.NODE_ENV === 'development'
})

/**
 * Update global promise definition
 */
declare global {
	var Promise:typeof Bluebird
	
	interface CancelablePromiseResolver<T> extends Promise.Resolver<T> {
		isCancelled():boolean
		getResult():T
		cancel():void
		onCancel(cancelCallback:(CancelablePromiseResolver) => any):void
	}
	
	interface PromiseConstructor {
		setImmediate():Promise<void>
		defer():CancelablePromiseResolver<any>
		defer<T>():CancelablePromiseResolver<T>
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
			result,
			onCancel,
			ref,
			cancelled = false,
			cancelCallbacks = []
		
		const promise = new Promise(function (resolver, rejecter, onCancelRegistrar) {
			resolve = (resolvedResult) => {
				result = resolvedResult
				return resolver(resolvedResult)
			}
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
			getResult: () => result,
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