import { Map, Record, List } from "immutable"

import {app,Tray} from 'electron'
import { addHotDisposeHandler, acceptHot, setDataOnHotDispose, getHot, searchPathsForFile } from "epic-global"

const
	dataUrl = require('dataurl'),
	TrayIconPng = require('!!file-loader!epic-assets/images/icons/tray-icon.png'),
	TrayIconIco = require('!!file-loader!epic-assets/images/icons/tray-icon.ico'),
	TrayIcon = searchPathsForFile(Env.isWin32 ? TrayIconIco : TrayIconPng),
	TrayIconUrl = dataUrl.format({
		mimetype:Env.isWin32 ? 'image/ico' : 'image/png',
		data: require('fs').readFileSync(TrayIcon)
	})

/**
 * Created by jglanz on 12/20/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Tray
 *
 * @class Tray
 * @constructor
 **/
export namespace TrayLauncher {
	
	
	
	let
		tray:Electron.Tray
	
	
	
	export async function start() {
		if (!tray) {
			tray = new Tray(TrayIcon)
		}
	}
	
	// IF HOT RELOADED THEN AUTO START
	if (getHot(module,'started',false)) {
		start()
	}
	
	// HMR - MARK
	setDataOnHotDispose(module,() => ({
		started:true
	}))
	
	// HMR ON DISPOSE DESTROY
	addHotDisposeHandler(module,() => {
		if (tray)
			tray.destroy()
	})
	
}




export default TrayLauncher

acceptHot(module,log)