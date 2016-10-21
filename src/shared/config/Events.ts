
/**
 * Global Event Types
 */
export enum EventType {
	MainReady = 1,
	MainBooted,
	ChildrenReady,
	UIReady,
	StoreGetMainState,
	StoreMainStateChanged,
	StoreRendererDispatch,
	StoreRendererRegister,
	Clean
	
}

/**
 * Event Constants
 */
export const Events = {
	Clean: EventType[EventType.Clean],
	MainBooted: EventType[EventType.MainBooted],
	MainReady: EventType[EventType.MainReady],
	ChildrenReady: EventType[EventType.ChildrenReady],
	UIReady: EventType[EventType.UIReady],
	StoreGetMainState: EventType[EventType.StoreGetMainState],
	StoreMainStateChanged: EventType[EventType.StoreMainStateChanged],
	StoreRendererRegister: EventType[EventType.StoreRendererRegister],
	StoreRendererDispatch: EventType[EventType.StoreRendererDispatch],
}
