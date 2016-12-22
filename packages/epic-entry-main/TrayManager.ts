import { Map, Record, List } from "immutable"

import {app,Tray} from 'electron'
import { addHotDisposeHandler, acceptHot, setDataOnHotDispose, getHot, searchPathsForFile } from "epic-global"
import { getAppActions } from "epic-typedux/provider"
import { getValue } from "typeguard"

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
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Tray
 *
 * @class Tray
 * @constructor
 **/
export namespace TrayLauncher {
	
	
	
	let
		tray:Electron.Tray
	
	/**
	 * Get window instance
	 *
	 * @returns {IWindowInstance}
	 */
	function getTrayWindowInstance() {
		return getAppActions().getTrayWindow()
	}
	
	/**
	 * Get the actual browser window
	 * @returns {Electron.BrowserWindow}
	 */
	function getTrayWindow() {
		return getTrayWindowInstance().window
	}
	
	/**
	 * Open tray - assigned to global scope too
	 * @param bounds
	 */
	export function openTray(bounds = getValue(() => tray.getBounds())) {
		getAppActions().openTray(bounds)
	}
	
	/**
	 * Close the tray
	 */
	export function closeTray() {
		getAppActions().closeTray()
	}
	
	const
		unsubscribers = [
			EventHub.on(EventHub.TrayOpen,() => openTray()),
			EventHub.on(EventHub.TrayClose,() => closeTray())
		]
	
	
	/**
	 * On try click, show window
	 */
	function onClick(event,bounds) {
		log.debug(`tray clicked, opening`,event,bounds)
		openTray(bounds)
	}
	
	function onFocus() {
		log.debug(`tray focus`)
	}
	
	function onBlur() {
		log.debug(`tray blur`)
		
		//getTrayWindow().hide()
	}
	
	function onClose() {
		log.debug(`tray close`)
	}
	
	/**
	 * Start the TrayLauncher
	 *
	 * @returns {Promise<void>}
	 */
	export async function start() {
		let
			win:Electron.BrowserWindow = null
		
		const
			deferred = Promise.defer(),
			tryWin = () => {
				try {
					win = getTrayWindow()
					deferred.resolve()
				} catch (err) {
					log.warn(`tray window isn't ready yet`)
					
					if (!deferred.promise.isRejected() && !deferred.promise.isResolved()) {
						setTimeout(tryWin,500)
					}
				}
			}
			
		
		tryWin()
		
		// WAIT FOR THE WINDOW
		await deferred.promise.timeout(10000)
		
		if (tray) {
			return log.warn(`Tray already exists`)
		}
		
		tray = new Tray(TrayIcon)
		tray.on('click',onClick)
		
		win
			.on('focus',onFocus)
			.on('blur',onBlur)
			.on('close',onClose)
		
		// REMOVE ON HMR
		addHotDisposeHandler(module,() => {
			win.removeListener('blur',onBlur)
			win.removeListener('close',onClose)
			win.removeListener('focus',onFocus)
		})
	}
	
	
	/**
	 * HMR
	 */
	
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
		unsubscribers.forEach(it => it())
		
		if (tray)
			tray.destroy()
	})
	
}





export default TrayLauncher

acceptHot(module,log)