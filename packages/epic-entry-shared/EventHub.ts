

import { EnumEventEmitter } from "epic-global/EnumEventEmitter"
import { EventType } from "epic-global/Constants"

const
	log = getLogger(__filename)


/**
 * Underlying emitter
 *
 * @type {EnumEventEmitter<EventType>}
 */
class EventHubImpl extends EnumEventEmitter<EventType> {
	constructor() {
		super(EventType)
	}
}

const EventHub = new EventHubImpl()

export type TEventHub = typeof EventHub

export default EventHub
