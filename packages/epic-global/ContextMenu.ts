
import Electron = require('electron')
import { isString, getValue } from "typeguard"
import { shortId } from "./IdUtil"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	{remote} = Electron,
	{BrowserWindow,Menu,MenuItem} = remote || Electron


function addMenuCommand(menu:Electron.Menu,command:ICommand,execute:() => any) {
	menu.append(new MenuItem({
		label: command.description || command.name,
		click: execute,
		accelerator: command.defaultAccelerator
	}))
}


export class ContextMenu {
	
	static create() {
		return new ContextMenu()
	}
	
	private menu = new Menu()
	
	
	
	/**
	 * Add a simple label
	 *
	 * @param label
	 * @returns {ContextMenu}
	 */
	addLabel(label:string) {
		this.menu.append(new MenuItem({label}))
		
		return this
	}
	
	/**
	 * Add a command
	 *
	 * @param command
	 * @param execute
	 * @returns {ContextMenu}
	 */
	addCommand(command:ICommand|string,execute:() => any) {
		if (isString(command))
			command = getValue(() => Commands[<string>command],{
				type: CommandType.Container,
				name: command,
				id: shortId()
			})
		
		addMenuCommand(this.menu,command,execute)
		
		return this
	}
	
	/**
	 * Add a seperator
	 *
	 * @returns {ContextMenu}
	 */
	addSeparator() {
		this.menu.append(new MenuItem({type: 'separator'}))
		
		return this
	}
	
	/**
	 * Popup
	 */
	popup() {
		this.menu.popup(remote ? remote.getCurrentWindow() : BrowserWindow.getFocusedWindow())
	}
}