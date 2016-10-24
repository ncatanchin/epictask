

import { EnumEventEmitter } from  "./EnumEventEmitter"
const
	log = getLogger(__filename),
	inWindow = typeof window !== 'undefined'

export type TPersistentValueDeserializer<T> = (value:string) => T

export type TPersistentValueSerializer<T> = (value:T) => string

export enum PersistentValueEvent {
	Loaded,
	Persisted,
	Changed
}

/**
 * Wraps persistence
 */
export class PersistentValue<T> extends EnumEventEmitter<PersistentValueEvent> {
	
	/**
	 * Current store value
	 */
	private value:T
	
	/**
	 * The raw string value
	 */
	private rawValue:string
	
	constructor(
		private key:string,
		private defaultValue:T = null,
		private serializer:TPersistentValueSerializer<T> = null,
		private deserializer:TPersistentValueDeserializer<T> = null
	) {
		super(PersistentValueEvent)
		
		if (!inWindow)
			return
		
		this.load()
		
		window.addEventListener('storage',this.onStorageEvent)
	}
	
	/**
	 * On storage event - check for our key
	 *
	 * @param event
	 */
	private onStorageEvent = (event:StorageEvent) => {
		log.debug(`Storage event for key ${event.key}`)
		if (event.key !== this.key)
			return
		
		this.load()
		
		this.emit(PersistentValueEvent.Changed,this.value)
	}
	
	/**
	 * Load the value from persistent storage
	 */
	private load() {
		if (!inWindow)
			return
		
		this.rawValue = localStorage.getItem(this.key)
		this.value = this.deserialize(this.rawValue)
		
		if (_.isNil(this.value) && !_.isNil(this.defaultValue))
			this.value = this.defaultValue
			
		//this.emit(PersistentValueEvent.Loaded,this.value)
	}
	
	/**
	 * Deserialize a stored value
	 *
	 * @param value
	 * @returns {T}
	 */
	private deserialize(value:string):T {
		return this.deserializer ? this.deserializer(value) : value as any
	}
	
	/**
	 * Serialize value to a string
	 *
	 * @param value
	 * @returns {T}
	 */
	private serialize(value:T):string {
		return this.serializer ? this.serializer(value) : value as any
	}
	
	/**
	 * Set a new value
	 *
	 * - if the value is different then the current value
	 *  then return value is the new value
	 *
	 * - if not, the return value is null
	 *
	 * @param item
	 * @returns {T|null} item param when changed, null when not changed
	 */
	set(item:T) {
		const
			rawValue = (this.serializer ? this.serialize(item) : item) as string
				 
		if (rawValue === this.rawValue)
			return null
		
		this.rawValue = rawValue
		this.value = item
		
		localStorage.setItem(this.key,rawValue)
		
		this.emit(PersistentValueEvent.Changed,item)
		this.emit(PersistentValueEvent.Persisted,item)
		return item
	}
	
	/**
	 * Get the current value
	 *
	 * @returns {T}
	 */
	get() {
		return this.value
	}
	
}

