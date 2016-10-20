




import windowStateKeeper = require('electron-window-state')
import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import Electron = require('electron')
import * as React from 'react'

import { shortId, isString } from "shared/util/ObjectUtil"
import { IWindowConfig, WindowType, DevToolsPositionDefault,AllWindowDefaults } from "shared/config/WindowConfig"
import { toJSON } from "shared/util/JSONUtil"
import { getAppEntryHtmlPath } from "shared/util/TemplateUtil"



const
	log = getLogger(__filename),
	
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
	config:IWindowConfig
	window:Electron.BrowserWindow
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
					[it.id,it.config.name].includes(criteria) :
					
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
	 * Open a pre-configured dialog
	 * @param name
	 */
	openDialog(name:string) {
		require.ensure(['ui/DialogsAndSheets'],function(require) {
			const
				{DialogConfigs} = require('ui/DialogsAndSheets') as any
			
			getWindowManager().open(DialogConfigs[name] as IWindowConfig)
		})
	}
	
	/**
	 * Open a new dialog with a given config
	 *
	 * @param config
	 * @returns {{id: string, config: IWindowConfig, window: Electron.remote.BrowserWindow}}
	 */
	open(config:IWindowConfig)
	open(id:string,config:IWindowConfig)
	open(configOrId:string|IWindowConfig,config?:IWindowConfig) {
		const
			windowCreateDeferred = Promise.defer()
		
		try {
			
			let
				id = null
			
			if (isString(configOrId)) {
				id = configOrId
			} else {
				id = `${configOrId.name}-${shortId()}`
				config = configOrId
			}
			
			// IF SINGLE WINDOW THEN ALWAYS USE CONFIG NAME
			if (config.singleWindow) {
				id = config.name
			}
			
			// CHECK FOR EXISTING WINDOW (ONLY IN CASE ID WAS PROVIDED
			let
				existingWindowInstance = this.windows.find(it => it.id === id)
			
			if (existingWindowInstance) {
				log.warn(`Window with id ${id} already exists - returning`)
				return existingWindowInstance
			}
			
			
			const
				newWindowOpts = _.merge(
					{
						backgroundColor: getPalette().background
					},
					
					// TYPE DEFAULTS
					WindowTypeDefaults[ config.type ],
					
					// CONFIG DEFAULTS
					(config.type === WindowType.Dialog || config.type === WindowType.Modal) && {
						parent: Electron.remote.getCurrentWindow()
					},
					
					// MANAGER PARTITIONING
					{
						
					},
					config.opts || {}
				)
			
			// IF STORE STATE ENABLED, CREATE STATE MANAGER
			let
				childWindowState:ElectronWindowState.WindowState
			
			if (config.storeState) {
				childWindowState = windowStateKeeper({ file: `child-window-${id}.state` })
			}
			
			// TODO: REMOVE - TEST
			const
				windowSession = Electron.remote.getCurrentWebContents().session,
				windowConfig = toJSON(config, true),
				windowConfigCookie = {
					url: 'https://densebrain.com/epictask',
					name: id,
					value: config.name
				}
			
			
			windowSession.cookies.set(windowConfigCookie, (err) => {
				if (err) {
					log.error(`Failed to create window config cooke`, err)
					return windowCreateDeferred.reject(err)
				}
				
				
				// CREATE WINDOW AND GET TO WORK
				const
					newWindow = new Electron.remote.BrowserWindow(Object.assign({}, childWindowState, newWindowOpts)),
					
					windowInstance = this.windows[ this.windows.length ] = {
						id,
						type: config.type,
						config,
						window: newWindow
					},
					templateURL = getAppEntryHtmlPath(),
					url = `file://${templateURL}#EPIC_ENTRY=${ProcessConfig.getTypeName(ProcessType.UIChildWindow)}&EPIC_WINDOW_ID=${id}`
				
				// IF WE HAVE A WINDOW STATE MANAGER THEN GO TO WORK
				if (childWindowState) {
					childWindowState.manage(newWindow)
				}
				
				log.debug(`Loading dialog ${id} with URL:`, url)
				newWindow.loadURL(url)
				
				// OPEN DEV TOOLS IF CONFIGURED
				if (DEBUG && config.showDevTools) {
					newWindow.show()
					newWindow.webContents.openDevTools({
						mode: config.devToolsPosition || DevToolsPositionDefault
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
			})
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
