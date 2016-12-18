import * as fs from "fs"
import { ClassType } from "react"
import { ProcessType } from "epic-entry-shared/ProcessType"
import { searchPathsForFile } from "epic-global/Files"
import { ProcessNames } from "epic-entry-shared/ProcessType"


const
	// WEBPACK REMOVE TWEAKS
	iconFile256 =
		require('!!file-loader!buildResources/icons/256x256.png'),
	iconFile128 =
		require('!!file-loader!buildResources/icons/128x128.png'),
	
	dataUrl = require('dataurl')
	
let
	iconPath256 = searchPathsForFile(iconFile256),
	iconRawData256 = fs.readFileSync(iconPath256),
	iconUrl256 = dataUrl.format({
		mimetype:'image/png',
		data:iconRawData256
	}),
	iconPath128 = searchPathsForFile(iconFile128),
	iconRawData128 = fs.readFileSync(iconPath128),
	iconUrl128 = dataUrl.format({
		mimetype:'image/png',
		data:iconRawData128
	})
	
	
	//iconRawData = require('!!raw!build/icon.icns'),
	//iconPath = 'build/icons/128x128.png',
	
console.log(`Original icon file: ${iconFile256} / path ${iconPath256}`)

if (!iconPath256) {
	console.log(`Icon not resolved, using url`)
	iconPath256 = iconUrl256
}

/**
 * Window Icon
 */
export const
	WindowIconUrl256 = iconUrl256,
	WindowIconPath256 = iconPath256,
	WindowIcon256 = iconPath256,
	WindowIconUrl128 = iconUrl128,
	WindowIconPath128 = iconPath128,
	WindowIcon128 = iconPath128






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
		frame: !Env.isMac,
		acceptFirstMouse: true,
		title: 'Epictask',
		webPreferences: {
			
		}
	},!Env.isMac && {
		icon: WindowIcon256
	},Env.isMac && {
		titleBarStyle: 'hidden'
		// darkTheme:true,
	}) as any


/**
 * Default window props for all but Background processes
 */
export const WindowDefaultOpts = Object.assign(AllWindowDefaults, {
	minHeight: 200,
	minWidth: 200,
	width: 1024,
	height: 728,
	icon: WindowIcon256
})

/**
 * Dialog defaults
 */
export const WindowDialogDefaultOpts = Object.assign({}, WindowDefaultOpts, {
	minHeight: 500,
	minWidth: 500,
	width: 800,
	height: 600
})

/**
 * Modal window defaults
 */
export const WindowModalDefaultOpts = Object.assign({}, WindowDefaultOpts, WindowDialogDefaultOpts, {
	modal: true
})

/**
 * Background window defaults
 */
export const WindowBackgroundDefaultOpts = Object.assign(
	{},
	WindowDefaultOpts,{
		show: false
	}
)

/**
 * Map WindowType -> BrowserWindowOptions
 */
export const WindowOptionDefaults = {
	[WindowType.Normal]: WindowDefaultOpts,
	[WindowType.Dialog]: WindowDialogDefaultOpts,
	[WindowType.Modal]: WindowModalDefaultOpts,
	[WindowType.Background]: WindowBackgroundDefaultOpts
}


/**
 * Normal window defaults
 */
export const WindowConfigNormalDefaults = {
	name: "UI",
	type: WindowType.Normal,
	processType: ProcessType.UI,
	uri: "",
	singleWindow: false,
	autoRestart: false,
	showDevTools: Env.isDev,
	storeWindowState: true,
	opts: WindowDefaultOpts
}

/**
 * Dialog window defaults
 */
export const WindowConfigDialogDefaults = {
	type: WindowType.Dialog,
	processType: ProcessType.UI,
	singleWindow: false,
	autoRestart: false,
	showDevTools: false,
	storeWindowState: false,
	opts: WindowDialogDefaultOpts
}

/**
 * Modal window defaults
 */
export const WindowConfigModalDefaults = {
	type: WindowType.Modal,
	processType: ProcessType.UI,
	singleWindow: true,
	autoRestart: false,
	showDevTools: false,
	storeWindowState: true,
	opts: WindowModalDefaultOpts
}

/**
 * Background window defaults
 */
export const WindowConfigBackgroundDefaults = {
	type: WindowType.Background,
	uri: "",
	singleWindow: true,
	autoRestart: true,
	showDevTools: false,
	storeWindowState: true,
	opts: WindowBackgroundDefaultOpts
}

export const WindowConfigDefaults = {
	[WindowType.Normal]: WindowConfigNormalDefaults,
	[WindowType.Dialog]: WindowConfigDialogDefaults,
	[WindowType.Modal]: WindowConfigModalDefaults,
	[WindowType.Background]: WindowConfigBackgroundDefaults
}


/**
 * Background configs
 */
export const
	DatabaseServerWindowConfig:IWindowConfig = Object.assign({},
		WindowConfigBackgroundDefaults, {
			id: ProcessNames.DatabaseServer,
			name: ProcessNames.DatabaseServer,
			processType: ProcessType.DatabaseServer,
			showDevTools: false
		}),
	
	JobServerWindowConfig:IWindowConfig = Object.assign({},
		WindowConfigBackgroundDefaults,{
			id: ProcessNames.JobServer,
			name: ProcessNames.JobServer,
			processType: ProcessType.JobServer,
			showDevTools: false
		})


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


/**
 * Default dev tools position
 */
export const DevToolsPositionDefault:TDevToolsPosition = 'right'
