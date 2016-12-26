
import Electron = require('electron')
import { Menu } from "./Menu"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	{remote} = Electron,
	{BrowserWindow,MenuItem} = remote || Electron


function addMenuCommand(menu:Electron.Menu,command:ICommand,execute:() => any) {
	menu.append(new MenuItem({
		label: command.description || command.name,
		click: execute,
		accelerator: command.defaultAccelerator
	}))
}




export class ContextMenu extends Menu {
	
	static create() {
		return new ContextMenu()
	}
	
	/**
	 * Popup
	 */
	popup() {
		this.menu.popup(remote ? remote.getCurrentWindow() : BrowserWindow.getFocusedWindow())
	}
}