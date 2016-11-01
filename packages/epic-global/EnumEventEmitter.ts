
import {EventEmitter} from 'events'
import {enumKeys} from "./EnumUtil"
import { isNumber } from "./TypeChecks"



export interface IEnumEventHandler<E> {
	(event:E,...args:any[]):void
}

/**
 * Returned from 'on' to unsubscribe
 */
export interface IEnumEventRemover {
	():void
}

/**
 * Enum based EventEmitter
 */
export class EnumEventEmitter<E> {

	/**
	 * Internal reference to Node EventEmitter
	 *
	 */
	private emitter = new EventEmitter()
	
	private enumConstants
	
	/**
	 * Create a new emitter
	 *
	 * @param enumValues
	 */
	constructor(private enumValues:any) {
		this.enumConstants = Object.keys(enumValues).filter(it => isNumber(it))
	}
	
	
	
	
	/**
	 * Map an enum value to the string value
	 *
	 * @param event
	 */
	private eventName = (event:E):string => this.enumValues[event as any]
	
	private makeListener = (event:E,listener:IEnumEventHandler<E>) =>
		(...args:any[]) => listener(event,...args)
	
	
	private makeRemover = (event:E,wrappedListener:Function) =>
		() => this.removeListener(event,wrappedListener)
	
	
	onAll(listener:IEnumEventHandler<E>):IEnumEventRemover[] {
			return this.addAllListener(listener)
	}
	
	addAllListener(listener:IEnumEventHandler<E>):IEnumEventRemover[] {
		return enumKeys(this.enumValues).map((event:any) => {
				return this.addListener(event,listener)
			})
	}
	
	
	addListener(event: E,listener:IEnumEventHandler<E>): IEnumEventRemover {
		return this.on(event,listener)
	}
	
	once(event: E,listener:IEnumEventHandler<E>): IEnumEventRemover {
		return this.on(event,listener,true)
	}
	
	removeListener(event: E, listener: Function): this {
		this.emitter.removeListener(this.eventName(event), listener)
		return this
	}
	
	removeAllListeners(event?: E): this {
		this.emitter.removeAllListeners(this.eventName(event))
		return this
	}
	
	listeners(event: E): Function[] {
		return this.emitter.listeners(this.eventName(event))
	}
	
	/**
	 * On event, trigger handler
	 * @param event
	 * @param listener
	 * @param once
	 * @returns {IEnumEventRemover}
	 */
	on(event:E,listener:IEnumEventHandler<E>,once = false):IEnumEventRemover {
		const
			eventName = this.eventName(event),
			wrappedListener = this.makeListener(event,listener),
			remover = this.makeRemover(event,wrappedListener)
		
		this.emitter[once ? 'once' : 'on'].apply(this.emitter,[eventName,wrappedListener])

		return remover
	}
	
	

	/**
	 * Emit an event
	 *
	 * @param event
	 * @param args
	 */
	emit(event:E,...args:any[]) {
		this.emitter.emit(this.eventName(event),...args)
	}

}
