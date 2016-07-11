
import {EventEmitter} from 'events'

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
	 * @type {"events".EventEmitter}
	 */
	private emitter = new EventEmitter()

	/**
	 * Create a new emitter
	 *
	 * @param enumValues
	 */
	constructor(private enumValues:any) {}

	/**
	 * Map an enum value to the string value
	 *
	 * @param event
	 */
	private eventName = (event:E):string => this.enumValues[event as any]

	/**
	 * On event, trigger handler
	 * @param event
	 * @param handler
	 * @returns {IEnumEventRemover}
	 */
	on(event:E,handler:IEnumEventHandler<E>):IEnumEventRemover {
		const eventName = this.eventName(event)

		const wrappedHandler = (...args:any[]) => handler(event,...args)

		this.emitter.on(eventName,wrappedHandler)

		return () => this.emitter.removeListener(eventName,wrappedHandler)
	}

	/**
	 * Emit an event
	 *
	 * @param event
	 * @param args
	 */
	emit(event:E,...args:any[]) {
		const eventName = this.eventName(event)

		this.emitter.emit(eventName,...args)
	}

}