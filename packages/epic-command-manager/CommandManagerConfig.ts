import * as TypeLogger from 'typelogger'
import { isMac } from "shared/util/ElectronUtil"

const
	log = TypeLogger.create(__filename)

// TRY & RESOLVE ELECTRON
let
	electronResolved = false

try {
	const
		Electron = require('electron')
	
	electronResolved = typeof Electron !== 'string'
} catch (err) {
	log.debug(`Electron not resolved`,err)
}



export const
	CommandOrControl = 'CommandOrControl',
	Super = 'super',
	Command = 'control',
	Cmd = 'cmd',
	Meta = 'meta',
	Control = 'control',
	Ctrl = 'ctrl',
	Alt = 'alt',
	Shift = 'shift',
	Down = 'ArrowDown',
	Up = 'ArrowUp',
	Right = 'ArrowRight',
	Left = 'ArrowLeft',
	
	MappedKeys = {
		[CommandOrControl.toLowerCase()]: isMac() ? Meta : Ctrl,
		[Control]: Ctrl,
		[Super]: Meta,
		[Command]: Meta,
		[Cmd]: Meta
	},
	
	// KEY CODE -> ELECTRON KEY CODE
	ElectronMappedKeys = {
		[Meta]: 'Super',
		[Ctrl]: 'Control',
		[Alt]: 'Alt',
		[Shift]: 'Shift',
		[Down]: 'Down',
		[Up]: 'Up',
		[Left]: 'Left',
		[Right]: 'Right'
	},
	
	// KEYS - MODIFIER KEYS
	ModifiedKeyNames = [Ctrl,Alt,Meta,Shift],



	//INPUT TAG NAMES
	InputTagNames = ['INPUT','SELECT','TEXTAREA'],
	
	// IN MAIN ELECTRON PROCESS
	isMain = electronResolved && process.type === 'browser',
	
	// ELECTRON AVAILABLE
	isElectron = electronResolved
