import _ from './LoDashMixins'

export enum WindowType {
	Normal = 1,
	Tray = 2,
	Dialog = 3,
	Modal = 4,
	Background = 5
}

export const WindowEvents = {
	Ping: 'Ping',
	Pong: 'Pong',
	AllResourcesLoaded: 'AllResourcesLoaded',
	Shutdown: 'Shutdown',
	ShutdownComplete: 'ShutdownComplete'
}

type TWindowEvents = typeof WindowEvents
type TWindowType = typeof WindowType

_.assignGlobal({
	WindowType,
	WindowEvents
})

declare global {
	
	
	let WindowEvents:TWindowEvents
	
}

