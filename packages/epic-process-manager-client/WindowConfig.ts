import * as fs from "fs"
import { ClassType } from "react"
import { ProcessType } from "epic-entry-shared/ProcessType"
import { searchPathsForFile } from "epic-global/Files"
import { ProcessNames } from "epic-entry-shared/ProcessType"


const
	// WEBPACK REMOVE TWEAKS
	iconFile =
		__NO_WEBPACK__ ?
			__non_webpack_require__('assets/images/icons/icon-256x256.png') :
			require('!!file!buildResources/icons/256x256.png'),
	
	dataUrl = require('dataurl')
	
let
	iconPath = searchPathsForFile(iconFile),
	iconRawData = fs.readFileSync(iconPath),
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

/**
 * Window Icon
 */
export const
	WindowIconUrl = iconUrl,
	WindowIconPath = iconPath,
	WindowIcon = iconPath






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
 * Default window props for all but Background processes
 */
export const WindowDefaultOpts = Object.assign(AllWindowDefaults, {
	minHeight: 200,
	minWidth: 200,
	width: 1024,
	height: 728,
	icon: WindowIcon
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
	showDevTools: true,
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
	DatabaseServerWindowConfig:IWindowConfig = Object.assign({
		id: ProcessNames.DatabaseServer,
		name: ProcessNames.DatabaseServer,
		processType: ProcessType.DatabaseServer
	},Object.assign({},WindowConfigBackgroundDefaults)),
	
	JobServerWindowConfig:IWindowConfig = Object.assign({
		id: ProcessNames.JobServer,
		name: ProcessNames.JobServer,
		processType: ProcessType.JobServer
	},Object.assign({},WindowConfigBackgroundDefaults))


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
export const DevToolsPositionDefault:TDevToolsPosition = 'undocked'
