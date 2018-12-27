import {EventEmitter} from "events"
import {AuthScope, IConfig} from "../config/Config"
import {isMain} from "../Process"
import * as Electron from 'electron'
import getLogger from "../log/Logger"

const
	ForwardEvent = "forward-event",
	log = getLogger(__filename)

export enum Events {
	AuthStart,
	AuthComplete,
	AuthError,
	ConfigChanged,
	RepoIssuesSynced
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
	
	
	
	on(event:"AuthStart", listener: () => void)
	on(event:"AuthComplete", listener: (accessToken:string,scope:Array<AuthScope>) => void)
	on(event:"AuthError", listener: (err:Error | null) => void)
	on(event:"ConfigChanged", listener: (config:IConfig) => void)
	on(event:"RepoIssuesSynced", listener: (repoId:number,timestamp:number) => void)
	on(event:EventNames, listener:(...args:any[]) => void) {
		this.emitter.on(event,listener)
	}
	
	off(event:EventNames, listener?:(...args:any[]) => void) {
		this.emitter.removeListener(event,listener)
	}
	
	emit(event:"AuthStart")
	emit(event:"AuthComplete", accessToken:string, scope:Array<AuthScope>)
	emit(event:"AuthError", err:Error | null)
	emit(event:"ConfigChanged", config:IConfig)
	emit(event:"RepoIssuesSynced", repoId:number,timestamp:number)
	emit(event:EventNames, ...args:any[]) {
		this.emitter.emit(event,...args)
		
		if (isMain())
			Electron.BrowserWindow.getAllWindows().forEach(win => win.webContents.send(ForwardEvent,event,args))
		else
			Electron.ipcRenderer.send(ForwardEvent,event,args)
	}
}


export const EventHub = new EventHubEmitter()

export default EventHub
