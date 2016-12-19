import { Map, Record, List } from "immutable"
import Electron = require('electron')
import { shortId, getUserDataFilename, readJSONFile, cloneObjectShallow, writeJSONFile } from "epic-global"
import { getValue, isNil } from "typeguard"

type BrowserWindow = Electron.BrowserWindow
const {BrowserWindow,screen} = Electron

/**
 * Created by jglanz on 12/6/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)



/**
 * WindowStateManager
 *
 * @class WindowStateManager
 * @constructor
 **/
export class WindowPositionManager {
	
	/**
	 * Filename for persistence
	 */
	private filename:string
	
	/**
	 * Current window position
	 */
	private position:IWindowPosition
	
	/**
	 * Create a new state manager
	 *
	 * @param window
	 * @param id
	 */
	constructor(private window:BrowserWindow, id:string) {
		this.filename = getUserDataFilename(`epic-window-state-${id}.json`)
	}
	
	/**
	 * attach listeners
	 */
	attach = () => {
		this.load()
		
		const
			win = this.window
		
		win.on('resize',this.onChangeListener)
		win.on('move',this.onChangeListener)
		
		return this.detach
	}
	
	/**
	 * Detach listeners
	 */
	detach = () => {
		const
			win = this.window
		
		win.removeListener('move',this.onChangeListener)
		win.removeListener('resize',this.onChangeListener)
	}
	
	/**
	 * onChangeListener
	 */
	private onChangeListener = () => {
		this.save()
	}
	
	/**
	 * Save the current position
	 *
	 * @param force if true then debounce is skipped
	 */
	save(force = false) {
		const
			win = this.window
		
		let
			bounds = cloneObjectShallow(win.getBounds())
		
		const
			position = this.position || {bounds}
		
		if (this.isNormal()) {
			position.bounds = bounds
		}
		
		position.isMinimized = win.isMinimized()
		position.isMaximized = win.isMaximized()
		position.isFullScreen = win.isFullScreen()
		position.displayBounds = screen.getDisplayMatching(bounds).bounds
		
		this.position = position
		
		if (force) {
			this.saveDebounce.cancel()
			this.saveNow()
		} else {
			this.saveDebounce()
		}
	}
	
	private isNormal() {
		const
			win = this.window
		
		return !win.isMaximized() && !win.isMinimized() && !win.isFullScreen();
	}
	
	/**
	 * Save write now
	 */
	private saveNow = () => {
		try {
			log.debug(`Saving window position: ${this.filename}`)
			writeJSONFile(this.filename,this.position)
		} catch (err) {
			log.error(`Failed to save window position: ${this.filename}`,err)
		}
	}
	
	/**
	 * Save debounced internal
	 */
	private saveDebounce = _.debounce(this.saveNow,250)
	
	
	/**
	 * Load position
	 */
	private load() {
		try {
			const
				position = readJSONFile(this.filename)
			
			if (position) {
				this.position = position
				if (getValue(() => !isNil(this.position.bounds.width),false)) {
					
					const
						win = this.window,
						finalBounds = cloneObjectShallow(position.bounds,{
							width: Math.max(position.bounds.width, 800),
							height: Math.max(position.bounds.height, 500)
						})
					
					win.setBounds(finalBounds)
					
					// UPDATE THE WINDOW
					if (position.isMaximized) {
						win.maximize()
					} else if (position.isFullScreen) {
						win.setFullScreen(true)
					}
					
				}
				
			}
		} catch (err) {
			log.warn(`Unable to load state`,err)
		}
		
	}
	
}

declare global {
	
	interface IWindowPosition {
		bounds?:Electron.Rectangle
		displayBounds?:Electron.Rectangle
		isMaximized?:boolean
		isFullScreen?:boolean
		isMinimized?:boolean
	}
	
	
	interface IWindowPositionManager extends WindowPositionManager {
		
	}
}

export default WindowPositionManager