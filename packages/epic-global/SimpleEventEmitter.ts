
/**
 * Created by jglanz on 10/27/16.
 */

import {EventEmitter} from 'events'

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	SimpleEvent = Symbol("SimpleEvent")

/**
 * SimpleEventEmitter - single event emitter
 *
 * @class SimpleEventEmitter
 * @constructor
 **/
export class SimpleEventEmitter<ListenerType extends Function> {
	
	private emitter = new EventEmitter()
	
	constructor() {
		
	}
	
	addListener(fn:ListenerType) {
		this.emitter.addListener(SimpleEvent,fn)
	}
	
	removeListener(fn:ListenerType) {
		this.emitter.removeListener(SimpleEvent,fn)
	}
	
	emit:ListenerType = ((...args) => {
		this.emitter.emit(SimpleEvent,...args)
	}) as any
	
}