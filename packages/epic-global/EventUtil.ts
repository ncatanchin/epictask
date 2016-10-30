import {EventEmitter} from 'events'
import {ILogger} from 'typelogger'

export function attachEvents(log:ILogger,emitter:EventEmitter,handlerMap:{[type:string]:Function}) {
	const
		removers:Function[] = Object
			.keys(handlerMap)
			.map(key => {
				const
					handler = handlerMap[key],
					wrappedHandler = (...args) => {
						if (log)
							log.debug(`Received event ${key}`)
						
						handler(...args)
					}
					
				emitter.on(key,wrappedHandler)
				
				return () => {
					try {
						emitter.removeListener(key,wrappedHandler)
					} catch (err) {
						log.error(`Failed to remove handler for event: ${key}`,err)
					}
				}
			})
	
	return () => {
		removers.forEach(remover => remover())
	}
}