import {ClassType} from 'react'

import { searchPathsForFile } from  "epic-global/Files"
import * as fs from 'fs'

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
