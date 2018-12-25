import {getUserDataDir} from "../Paths"
import * as Fs from 'fs'
import getLogger from "../log/Logger"
import {Either} from "prelude-ts"
import {IConfig} from "./Config"
import EventHub from "../events/Event"
import {isMain} from "../Process"
import  * as Electron from 'electron'
import {guard} from "typeguard"

const log = getLogger(__filename)



let loaded = false

const config:IConfig = {
	accessToken: null,
	scope: []
}

function getFilename():string {
	return `${getUserDataDir()}/config.json`
}

function patchFromDisk():void {
	const filename = getFilename()
	if (Fs.existsSync(filename)) {
		Either.try_(() => Fs.readFileSync(filename,'utf-8').toString(),{} as Error)
			.ifLeft(err => log.error("Unable to load config", err))
			.ifRight(json => updateConfig(JSON.parse(json) as IConfig,false))
	}
	
	EventHub.emit("ConfigChanged", config)
}

function load():void {
	if (loaded) return
	loaded = true
	patchFromDisk()
	
	const filename = getFilename()
	Fs.watchFile(filename, {
		persistent: false,
		interval: 500
	}, () => patchFromDisk())
}

function save():void {
	const filename = getFilename()
	guard(() => Fs.writeFileSync(filename, JSON.stringify(config, null, 2)))
}

export function updateConfig(patch:Partial<IConfig>, persist:boolean = true):IConfig {
	if (isMain()) {
		Object.assign(config, patch)
		if (persist)
			save()
		return config
	} else {
		return Electron.ipcRenderer.sendSync("updateConfig", config)
	}
}

export function getConfig():IConfig {
	if (isMain()) {
		if (!loaded)
			load()
		
		return config
	} else {
		return Electron.ipcRenderer.sendSync("getConfig")
	}
}


if (isMain()) {
	Electron.ipcMain.on("getConfig",(event:Electron.Event) => {
		event.returnValue = getConfig()
	})
	
	Electron.ipcMain.on("updateConfig",(event:Electron.Event, patch:Partial<IConfig>) => {
		event.returnValue = updateConfig(patch)
	})
}
