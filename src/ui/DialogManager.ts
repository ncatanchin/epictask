





import { getHot, setDataOnHotDispose, acceptHot } from "shared/util/HotUtils"
import { ICommand, TCommandContainer } from "shared/commands/Command"
import Electron = require('electron')
import * as React from 'react'
import * as ReactDOM from 'react-dom'

import { shallowEquals, shortId, isString } from "shared/util/ObjectUtil"
import { IDialogConfig } from "shared/UIConstants"

const
	log = getLogger(__filename),
	
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		clazz:typeof DialogManager,
		instance:DialogManager,
		hotInstance:DialogManager
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Command container registration
 */
export interface ICommandContainerRegistration {
	container:TCommandContainer
	element?:HTMLElement
	available:boolean
	focused:boolean
	commands?:ICommand[]
}


export interface IDialog {
	id:string
	config:IDialogConfig
	window:Electron.BrowserWindow
}

/**
 * The command manager - menu, shortcuts, containers, etc
 */
export class DialogManager {
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new DialogManager()
		
		return instanceContainer.instance
	}
	
	
	private dialogs:IDialog[] = []
	
	/**
	 * Private constructor for creating the command manager
	 */
	private constructor() {
		
	}
	
	
	/**
	 * Close all Dialogs
	 */
	closeAll() {
		while (this.dialogs.length) {
			const
				dialog = this.dialogs.shift()
			
			this.close(dialog)
		}
	}
	
	/**
	 * Close all dialogs with the given config
	 *
	 * @param config
	 */
	closeWithConfig(config:IDialogConfig) {
		const
			dialogsToClose = this.dialogs.filter(it => it.config.name === config.name)
		
		log.debug(`Going to close dialogs`,dialogsToClose,'from config',config)
		
		while (dialogsToClose.length) {
			const
				dialog = dialogsToClose.shift()
			
			log.debug(`Closing dialog`,dialog)
			this.close(dialog)
		}
	}
	
	/**
	 * Close a dialog with a specific id
	 *
	 * @param id
	 */
	close(id:string)
	close(dialog:IDialog)
	close(idOrDialog:string|IDialog){
		let
			dialog:IDialog,
			index:number
		
		if (isString(idOrDialog)) {
			index = this.dialogs.findIndex(it => it.id === idOrDialog)
			dialog = index > -1 && this.dialogs[index]
		} else {
			dialog = idOrDialog
			index = this.dialogs.findIndex(it => it.id === dialog.id)
		}
		
		if (dialog) {
			dialog.window.destroy()
		}
		
		if (index > -1) {
			this.dialogs.splice(index,1)
		}
	}
	
	
	/**
	 * Open a new dialog with a given config
	 *
	 * @param config
	 * @returns {{id: string, config: IDialogConfig, window: Electron.remote.BrowserWindow}}
	 */
	open(config:IDialogConfig) {
		const
			id = `${config.name}-${shortId()}`,
			dialogWindow = new Electron.remote.BrowserWindow({
				parent: Electron.remote.getCurrentWindow(),
				frame:false,
				minHeight: 500,
				minWidth: 500
			}),
			dialog = this.dialogs[this.dialogs.length] = {
				id,
				config,
				window: dialogWindow
			},
			templateURL = require('path').resolve(process.cwd(),'dist/app/app-entry.html'),
			url = `file://${templateURL}#processType=${ProcessConfig.getTypeName(ProcessType.UIDialog)}&dialogName=${config.name}`
		
		log.debug(`Loading dialog ${id} with URL:`,url)
		dialogWindow.loadURL(url)
		dialogWindow.show()
		dialogWindow.on('close',() => {
			log.debug(`Dialog window closed ${id}`)
			
			// REMOVE THE WINDOW
			this.dialogs.splice(this.dialogs.findIndex(it => it.id === id),1)
		})
			
		return dialog
	}
}


/**
 * Get the command manager from anywhere
 * @type {()=>DialogManager}
 */
export const getDialogManager = getHot(module,'getDialogManager',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return instanceContainer.clazz.getInstance()
	}
})) as () => DialogManager


/**
 * Default export is the singleton getter
 */
export default getDialogManager


// REF TYPE FOR GETTER
type getDialogManagerType = typeof getDialogManager

/**
 * Add getDialogManager onto the global scope
 */
assignGlobal({getDialogManager})

/**
 * getDialogManager global declaration
 */
declare global {
	const getDialogManager:getDialogManagerType
}



/**
 * Update the singleton on HMR reload & set root clazz
 */
instanceContainer.clazz = DialogManager

if (instanceContainer.hotInstance) {
	Object.setPrototypeOf(instanceContainer.hotInstance,DialogManager.prototype)
}

setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getDialogManager
}))

acceptHot(module,log)
