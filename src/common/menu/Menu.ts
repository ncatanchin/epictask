import Electron = require('electron')
import { isString, getValue } from "typeguard"
import getLogger from "common/log/Logger"
import {CommandType} from "common/command-manager/Command"
import Commands from "common/command-manager/CommandStore"
import {shortId} from "common/IdUtil"
import {assert} from "common/ObjectUtil"


const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	{remote} = Electron,
	{BrowserWindow,Menu:EMenu,MenuItem} = remote || Electron


function addMenuCommand(menu:Electron.Menu,command:ICommand, execute:() => any):void {
	menu.append(new MenuItem({
		label: command.description || command.name,
		click: execute,
		accelerator: command.defaultAccelerator as any
	}))
}




export class Menu {

	static create() {
		return new Menu()
	}

	protected menu = new EMenu()

	/**
	 * Get the underlying menu
	 *
	 * @returns {Electron.Menu}
	 */
	getElectronMenu() {
		return this.menu
	}

	/**
	 * Add a simple label
	 *
	 * @param label
	 * @returns {Menu}
	 */
	addLabel(label:string) {
		this.menu.append(new MenuItem({label}))

		return this
	}

	/**
	 * Add a checkbox
	 *
	 * @param label
	 * @param checked
	 * @param execute
	 */
	addCheckbox(label:string,checked:boolean,execute:() => any) {
		this.menu.append(new MenuItem({
			label,
			checked,
			type: 'checkbox',
			click:execute
		}))
		return this
	}

	/**
	 * Add a submenu
	 *
	 * @param label
	 * @returns {Menu}
	 */
	addSubmenu(label:string) {
		const
			submenu = new Menu()

		this.menu.append(new MenuItem({
			label,
			submenu: submenu.getElectronMenu()
		}))

		return submenu
	}

	/**
	 * Add a command
	 *
	 * @param command
	 * @param execute
	 * @returns {Menu}
	 */
	addCommand(command:ICommand|string,execute:(() => any) = null):this {
		if (isString(command))
			command = getValue(() => Commands[command as string],{
				type: CommandType.Container,
				name: command,
				id: shortId()
			}) as ICommand

		execute = execute || (command as any).execute

		assert(execute,`No execute found for ${command.name}`)

		addMenuCommand(this.menu,command,execute)

		return this
	}

	/**
	 * Add a seperator
	 *
	 * @returns {Menu}
	 */
	addSeparator() {
		this.menu.append(new MenuItem({type: 'separator'}))

		return this
	}

}
