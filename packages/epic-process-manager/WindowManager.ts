import Electron = require('electron')
import * as React from "react"
import {
	IWindowConfig,
	WindowType,
	DevToolsPositionDefault,
	AllWindowDefaults,
	getHot,
	setDataOnHotDispose,
	acceptHot,
	shortId,
	toJSON,
	getAppEntryHtmlPath,
	isString, getWindowConfig
} from "epic-global"

const
	log = getLogger(__filename),
	windowStateKeeper = require('electron-window-state'),
	
	// Container to support hot reloading
	instanceContainer = ((global as any).instanceContainer || {}) as {
		clazz:typeof WindowManager,
		instance:WindowManager,
		hotInstance:WindowManager
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)


const WindowDefaultOpts = Object.assign(AllWindowDefaults,{
	minHeight: 200,
	minWidth: 200
})

const WindowDialogDefaultOpts = Object.assign({},WindowDefaultOpts,{
	minHeight: 500,
	minWidth: 500,
	//titleBarStyle: 'hidden',
})

const WindowModalDefaultOpts = Object.assign({},WindowDefaultOpts,WindowDialogDefaultOpts,{
	modal: true
})


export const WindowTypeDefaults = {
	[WindowType.Normal]: WindowDefaultOpts,
	[WindowType.Dialog]: WindowDialogDefaultOpts,
	[WindowType.Modal]: WindowModalDefaultOpts
}

export interface IWindowInstance {
	id:string
	type:WindowType
	opts:Electron.BrowserWindowOptions
	window:Electron.BrowserWindow
	uri:string
	url:string
}

/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class WindowManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new WindowManager()
		
		return instanceContainer.instance
	}
	
	
	private windows:IWindowInstance[] = []
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		
	}
	
	
	/**
	 * Retrieve windows
	 */
	get all() {
		return [...this.windows]
	}
	
	/**
	 * Close all windows
	 */
	closeAll() {
		this.close(...this.windows)
	}
	
	
	
	/**
	 * Close a dialog with a specific id
	 *
	 * @param idsOrNames
	 */
	close(...idsOrNames:string[])
	/**
	 * Window instances
	 * @param windowInstances
	 */
	close(...windowInstances:IWindowInstance[])
	close(...idOrWindowInstances:Array<IWindowInstance|string>){
		let
			
			// CREATE REMOVE LIST
			windowsToClose:IWindowInstance[] = this.windows.filter(it =>
				idOrWindowInstances.find(criteria => isString(criteria) ?
					
					// IF IDS OR CONFIG NAMES - MATCH
					[it.id,it.uri].includes(criteria) :
					
					// IF WINDOW INSTANCES
					(it === criteria || it.id === criteria.id)
				)
			)
		
		//log.debug(`Going to close windows`,windowsToClose,'from config',idOrWindowInstances)
		
		// ITERATE AND DESTROY/REMOVE
		while (windowsToClose.length) {
			const
				win:IWindowInstance = windowsToClose.shift(),
				index = this.windows.findIndex(it => it.id === win.id)
			
			log.debug(`Closing win`,win)
			
			try{
				if (win.window.isClosable()) {
					win.window.close()
				}
			} catch (err) {
				log.warn(`Unable to close window, probably destroyed`,err)
			}
		
			
			if (index > -1) {
				this.windows.splice(index,1)
			}
		}
		
	}
	
	
	/**
	 * Open a new dialog with a given config
	 *
	 * @param uri
	 * @param type
	 * @param opts
	 * @param showDevTools
	 *
	 * @returns {{id: string, config: IWindowConfig, window: Electron.remote.BrowserWindow}}
	 */
	open(uri:string,type:WindowType,opts:Electron.BrowserWindowOptions = null,showDevTools = false) {
		const
			windowCreateDeferred = Promise.defer()
		
		try {
			
			const
				newWindowOpts = _.merge(
					{
						backgroundColor: require('epic-styles').getPalette().background
					},
					
					// TYPE DEFAULTS
					WindowTypeDefaults[ type ],
					
					// CONFIG DEFAULTS
					([ WindowType.Dialog, WindowType.Modal ].includes(type)) && {
						parent: Electron.remote.getCurrentWindow()
					},
					
					// MANAGER PARTITIONING
					{},
					opts || {}
				)
			
			// IF STORE STATE ENABLED, CREATE STATE MANAGER
			let
				childWindowState = null
			
			// TODO: REMOVE - TEST
			
			// CREATE WINDOW AND GET TO WORK
			const
				id = shortId(),
				newWindow = new Electron.remote.BrowserWindow(Object.assign({}, childWindowState, newWindowOpts)),
				templateURL = getAppEntryHtmlPath()
			
			let
				url = `file://${templateURL}#${uri}`
			url = url + (url.indexOf('?') > -1 ? '&' : '?') +
					`EPIC_ENTRY=` +
					ProcessConfig.getTypeName(ProcessType.UIChildWindow) +
					`&EPIC_WINDOW_ID=${id}`
			
			const
				windowInstance = this.windows[ this.windows.length ] = {
					id,
					type,
					opts: newWindowOpts as any,
					uri,
					url,
					window: newWindow
				}
			
			
			// IF WE HAVE A WINDOW STATE MANAGER THEN GO TO WORK
			if (childWindowState) {
				childWindowState.manage(newWindow)
			}
			
			log.debug(`Loading dialog ${id} with URL:`, url)
			newWindow.loadURL(url)
			
			// OPEN DEV TOOLS IF CONFIGURED
			if (DEBUG && showDevTools) {
				newWindow.show()
				newWindow.webContents.openDevTools({
					mode: DevToolsPositionDefault
				})
			}
			
			newWindow.once('ready-to-show', () => {
				
				log.debug(`Ready to show for window ${id}`)
				newWindow.setSheetOffset(500)
				newWindow.show()
				// newWindow.center()
				newWindow.focus()
			})
			
			
			newWindow.on('close', () => {
				log.debug(`Window closed ${id}`)
				
				// REMOVE THE WINDOW
				this.close(id)
				//this.windows.splice(this.windows.findIndex(it => it.id === id),1)
			})
			
			windowCreateDeferred.resolve(windowInstance)
			
		} catch (err) {
			windowCreateDeferred.reject(err)
		}
		
		return windowCreateDeferred.promise
		
	}
}


/**
 * Get the command manager from anywhere
 */
export const getWindowManager = getHot(module,'getWindowManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => WindowManager


/**
 * Default export is the singleton getter
 */
export default getWindowManager


// REF TYPE FOR GETTER
type getWindowManagerType = typeof getWindowManager

/**
 * Add getWindowManager onto the global scope
 */
assignGlobal({getWindowManager})

/**
 * getWindowManager global declaration
 */
declare global {
	const getWindowManager:getWindowManagerType
}



/**
 * Update the singleton on HMR reload & set root clazz
 */
instanceContainer.clazz = WindowManager

if (instanceContainer.hotInstance) {
	Object.setPrototypeOf(instanceContainer.hotInstance,WindowManager.prototype)
}

Object.assign((global as any), {
	instanceContainer: assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	})
})

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	
	getWindowManager
}))

acceptHot(module,log)
