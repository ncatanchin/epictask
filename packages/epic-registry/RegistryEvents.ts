import { EnumEventEmitter } from "type-enum-events"

/**
 * Registry events
 */
export enum RegistryEvent {
	Registered = 1,
	Unregistered = 2
}

/**
 * Registry event emitter
 *
 * @type {EnumEventEmitter<RegistryEvent>}
 */
const RegistryEvents = new EnumEventEmitter<RegistryEvent>(RegistryEvent)

/**
 * Add to global scope
 */
assignGlobal({
	RegistryEvents,
	RegistryEvent
})

declare global {
	const RegistryEvents:EnumEventEmitter<RegistryEvent>
	
	enum RegistryEvent {
		Registered = 1,
		Unregistered = 2
	}
}
