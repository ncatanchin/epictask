import {ClassType} from 'react'
import { searchPathsForFile } from  "epic-common"


const
	iconFile = require('!!file!buildResources/icons/256x256.png'),
	iconRawData = require('!!raw!buildResources/icons/256x256.png'),
	dataUrl = require('dataurl'),
	{nativeImage} = require('electron')
	
let
	iconPath = searchPathsForFile(iconFile),
	iconUrl = dataUrl.format({
		mimetype:'image/png',
		data:iconRawData
	})
	
	//iconRawData = require('!!raw!build/icon.icns'),
	//iconPath = 'build/icons/128x128.png',
	
console.log(`Original icon file: ${iconFile} / path ${iconPath}`)
if (!iconPath) {
	console.log(`Icon not resolved, using url`)
	iconPath = iconUrl
}

export const WindowIconUrl = iconUrl
export const WindowIconPath = iconPath
export const WindowIcon = iconPath

//export const WindowIcon = nativeImage.createFromDataURL(iconUrl)

//(!Env.isDev ? 'resources/' : '') + iconPath




/**
 * Window Type
 */
export enum WindowType {
	Normal,
	Dialog,
	Modal
}

/**
 * Dev tools position
 */
export type TDevToolsPosition = 'right'|'bottom'|'undocked'|'detach'

export const DevToolsPositionDefault:TDevToolsPosition = 'undocked'

/**
 * Window Configuration
 */
export interface IWindowConfig {
	
	/**
	 * Configuration name
	 */
	name:string
	
	/**
	 * In dev mode - show dev tools
	 */
	showDevTools?:boolean
	
	devToolsPosition?:TDevToolsPosition
	
	/**
	 * Store the windows state for future openings
	 */
	
	storeState?:boolean
	
	/**
	 * Only allow this config to exist 1 at a time
	 */
	singleWindow?:boolean
	
	/**
	 * Method that retrieves the root React Class
	 */
	rootElement:() => any
	
	/**
	 * Window type, this drivers parent/child enforcement
	 */
	type:WindowType
	
	/**
	 * Window options (Browser Window)
	 */
	opts?:Electron.BrowserWindowOptions
	
	
}


export interface IUISheet {
	name:string
	title:string
	rootElement:() => ClassType<any,any,any>
}


/**
 * Global common window defaults
 */
export const
	AllWindowDefaults = Object.assign({
		show: false,
		frame: false,
		acceptFirstMouse: true,
		title: '',
		webPreferences: {
			
		}
	},!Env.isMac && {
		icon: WindowIcon
	},Env.isMac && {
		//titleBarStyle: 'hidden'
		// darkTheme:true,
	}) as any


/**
 * Dialog Names
 */
export const Dialogs = {
	SettingsWindow: 'SettingsWindow',
	IssueEditDialog: 'IssueEditDialog',
	IssuePatchDialog: 'IssuePatchDialog',
	RepoSettingsWindow: 'RepoSettingsWindow',
	RepoAddTool: 'RepoAddTool',
	IssueCommentDialog: 'IssueCommentDialog'
}
