
import Electron from 'epic-electron'
import { EnumEventEmitter } from "epic-global/EnumEventEmitter"
import { EventType } from "epic-global/Constants"
import { fromPlainObject, toPlainObject } from "typetransform"
import { addHotDisposeHandler } from "epic-global/HotUtils"

const
	log = getLogger(__filename),
	{isMain} = Env


interface IEventHubMessage {
	source:string
	type:EventType
	args:any[]
}

export type TEventHub = EnumEventEmitter<EventType> & {
	broadcast(type:EventType,...args:any[])
}


/**
 * EventHub base Emitter
 *
 * @type {TEventHub}
 */
const EventHub = new EnumEventEmitter<EventType>(EventType) as TEventHub

const InternalEvents = {
	Broadcast: "@@EVENTHUB-BROADCAST"
}



/**
 * On renderer message received
 *
 * @param event
 * @param data
 */
function onMainMessage(event,data) {
	const
		msg = fromPlainObject(data) as IEventHubMessage
	
	log.debug(`Received message from renderer`,msg)
	EventHub.emit(msg.type,...msg.args)
	
	notifyChildren(msg,event.sender.id)
}


function subscribeMain() {
	const
		{ipcMain} = Electron
	
	ipcMain.on(InternalEvents.Broadcast,onMainMessage)
	
	addHotDisposeHandler(module,() => ipcMain.removeListener(InternalEvents.Broadcast,onMainMessage))
}


/**
 * On renderer message received
 *
 * @param event
 * @param data
 */
function onRendererMessage(event,data) {
	const
		msg = fromPlainObject(data) as IEventHubMessage
	log.debug(`Received message from main`,msg)
	EventHub.emit(msg.type,...msg.args)
}

/**
 * Subscribe for broadcasts
 */
function subscribeRenderer() {
	const
		{ipcRenderer} = Electron
	
	ipcRenderer.on(InternalEvents.Broadcast,onRendererMessage)
	
	addHotDisposeHandler(module,() => ipcRenderer.removeListener(InternalEvents.Broadcast,onRendererMessage))
}

/**
 * Subscribe to msgs from main
 */
function subscribe() {
	if (Env.isMain) {
		subscribeMain()
	} else {
		subscribeRenderer()
	}
		
}



/**
 * Broadcast event to all child windows
 *
 * @param msg
 * @param senderId if broadcast from a child
 */
function notifyChildren(msg:IEventHubMessage, senderId:number = null) {
	if (!Env.isMain)
		return
	
	const
		{webContents} = Electron,
		data = toPlainObject(msg)
	
	webContents.getAllWebContents()
		.filter(contents => contents.id !== senderId)
		.forEach(contents => {
			contents.send(InternalEvents.Broadcast,data)
		})
	
}

/**
 * Notify the main process
 *
 * @param msg
 */
function notifyMain(msg:IEventHubMessage) {
	
	const
		{ipcRenderer} = Electron,
		data = toPlainObject(msg)
	
	ipcRenderer.send(InternalEvents.Broadcast,data)
}

/**
 * Broadcast function for distributing messages to all windows/processes
 *
 * @param type
 * @param args
 */
function broadcast(type:EventType,...args:any[]) {
	EventHub.emit(type,...args)
	
	const
		msg = {
			source: getProcessId(),
			type,
			args
		}
	
	if (Env.isMain) {
		notifyChildren(msg)
	} else {
		notifyMain(msg)
	}
}


Object.assign(EventHub,{broadcast})



function onRemoteMessage(data) {
	const
		msg = fromPlainObject(data) as IEventHubMessage
	
	
}



/**
 * Underlying emitter
 *
 * @type {EnumEventEmitter<EventType>}
 */
// class EventHubImpl extends  {
//
//
// 	constructor() {
// 		super(EventType)
//
//
// 	}
//
// 	broadcast
// }
//
// const EventHub = new EventHubImpl()


export default EventHub
