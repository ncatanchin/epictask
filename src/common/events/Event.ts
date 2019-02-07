import {EventEmitter} from "events"
import {AuthScope, IConfig} from "../config/Config"
import {isMain} from "../Process"
import * as Electron from 'electron'
import getLogger from "../log/Logger"
import {isString} from "typeguard"
import {convertEnumValuesToString} from "common/ObjectUtil"
import {ISyncActionMessage} from "common/store/AppStoreTypes"
import {StringMap} from "common/Types"

const
	ForwardEvent = "forward-event",
	log = getLogger(__filename)

export enum Events {
	AuthStart,
	AuthComplete,
	AuthError,
	ConfigChanged,
	RepoIssuesSynced,
  ReposUpdated,
	WindowClosed,
	AcceleratorsChanged,
	CommandsChanged,
	ChildStoreAction,
	ServerStoreAction,
  NotificationsSynced,
  SyncAllData
}

export type EventNames = keyof typeof Events


class EventHubEmitter {

	private emitter = new EventEmitter()

	private onForwardEvent = (event:Electron.Event, eventName:EventNames,args:any[]) => {
		//log.info("On forwarded event",event,args)
		this.emitter.emit(eventName,...args)
	}

	constructor() {
		this.emitter.setMaxListeners(Number.MAX_SAFE_INTEGER)
		if (isMain())
			Electron.ipcMain.on(ForwardEvent,this.onForwardEvent)
		else
			Electron.ipcRenderer.on(ForwardEvent,this.onForwardEvent)
	}



	on(event:"AuthStart", listener: () => void):() => void
	on(event:"AuthComplete", listener: (accessToken:string,scope:Array<AuthScope>) => void):() => void
	on(event:"AuthError", listener: (err:Error | null) => void):() => void
	on(event:"ConfigChanged", listener: (config:IConfig) => void):() => void
  on(event:"NotificationsSynced", listener: (timestamp:number) => void):() => void
	on(event:"RepoIssuesSynced", listener: (repoId:number,timestamp:number) => void):() => void
	on(event:"WindowClosed", listener: () => void):() => void
	on(event:"CommandsChanged", listener: () => void):() => void
  on(event:"SyncAllData", listener: () => void):() => void
  on(event:"ReposUpdated", listener: () => void):() => void
	on(event:"AcceleratorsChanged", listener: () => void):() => void
	on(event:"ChildStoreAction" | "ServerStoreAction",listener: (actionMessage:ISyncActionMessage) => void):() => void
	on(event:EventNames, listener:(...args:any[]) => void):() => void {
		this.emitter.on(event,listener)
		return () => this.emitter.off(event,listener)
	}

	off(event:EventNames, listener?:(...args:any[]) => void) {
		this.emitter.removeListener(event,listener)
	}

	emit(event:"NotificationsSynced",timestamp:number)
	emit(event:"AuthStart")
	emit(event:"AuthComplete", accessToken:string, scope:Array<AuthScope>)
	emit(event:"AuthError", err:Error | null)
	emit(event:"ConfigChanged", config:IConfig)
	emit(event:"RepoIssuesSynced", repoId:number,timestamp:number)
	emit(event:"WindowClosed")
	emit(event:"CommandsChanged")
  emit(event:"SyncAllData")
  emit(event:"ReposUpdated")
	emit(event:"AcceleratorsChanged",accelerators:StringMap<string>)
	emit(event:"ChildStoreAction" | "ServerStoreAction",actionMessage:ISyncActionMessage)
	emit(event:EventNames, ...args:any[]) {
		this.emitter.emit(event,...args)

		if (isMain())
			Electron.BrowserWindow.getAllWindows().forEach(win => win.webContents.send(ForwardEvent,event,args))
		else
			Electron.ipcRenderer.send(ForwardEvent,event,args)
	}
}

export type EventNameMap = {[key in EventNames]:EventNames}

export type EventHubType = (EventHubEmitter & EventNameMap)

function create():EventHubType {
	const EventHub = new EventHubEmitter()
	Object.assign(EventHub,Events)
	return EventHub as any
}

export default create()
