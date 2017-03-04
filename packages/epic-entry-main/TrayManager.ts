import { screen, Tray } from "electron"
import { addHotDisposeHandler, acceptHot, setDataOnHotDispose, getHot, searchPathsForFile, AppKey } from "epic-global"
import { getAppActions, trayAutoHideSelector, trayStateSelector, TrayState } from "epic-typedux"
import { getValue, guard } from "typeguard"

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
export namespace TrayManager {
	
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
	export function openTray(bounds = null) {
		if (!bounds)
			bounds = getValue(() => tray.getBounds())
				
		
		if (bounds.y === 0) {
			const
				display = screen.getDisplayNearestPoint(_.pick(bounds,'x','y') as any)
			
			bounds.y = display.bounds.y
			
		}
		log.debug(`Opening with bounds`,bounds)
		getAppActions().openTray(bounds)
	}
	
	/**
	 * Toggle tray open/closed
	 *
	 * @param bounds
	 */
	export function toggleTray(bounds = getValue(() => tray.getBounds())) {
		getAppActions().toggleTray(bounds)
	}
	
	/**
	 * Close the tray
	 */
	export function closeTray() {
		getAppActions().closeTray()
	}
	
	/**
	 * On tray config changed
	 *
	 */
	function setTrayConfig() {
		const
			win = getValue(() => getTrayWindow())
		
		
		const
			trayState = trayStateSelector(getStore().getState())
		
		log.info(`Set tray config`, trayState && trayState.toJS())
	
		if (!win || !trayState)
			return log.info(`Tray window is not yet available`)
		
		win.setAlwaysOnTop(trayState.alwaysOnTop,'screen-saver')
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
	
	/**
	 * On focus
	 */
	function onFocus() {
		log.debug(`tray focus`)
	}
	
	/**
	 * On blur
	 */
	function onBlur() {
		
		const
			{autoHide,alwaysOnTop} = trayStateSelector(getStoreState())
		
		log.debug(`tray blur, autoHide=${autoHide},alwaysOnTop=${alwaysOnTop}`)
		if (alwaysOnTop !== true && autoHide !== false) {
			getTrayWindow().hide()
		}
	}
	
	/**
	 * On close
	 */
	function onClose() {
		log.debug(`tray close`)
	}
	
	/**
	 * Destroy the tray
	 */
	export function shutdown() {
		if (!tray)
			return
		
		log.info(`Tray shutdown`)
		
		guard(() => !tray.isDestroyed() && tray.destroy())
		tray = null
	}
	
	/**
	 * On shutdown, destroy
	 */
	EventHub.on(EventHub.Shutdown,shutdown)
	
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
		
		
		unsubscribers.push(getStore().observe([AppKey,'tray'],setTrayConfig))
		
		tray = new Tray(TrayIcon)
		tray.on('click',onClick)
		
		win
			.on('focus',onFocus)
			.on('blur',onBlur)
			.on('close',onClose)
		
		setTrayConfig()
		
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



export default TrayManager

acceptHot(module,log)
