import _ from './LoDashMixins'

export enum WindowType {
	Normal = 1,
	Dialog = 2,
	Modal = 3,
	Background = 4
}

export const WindowEvents = {
	Ping: 'Ping',
	Pong: 'Pong',
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

