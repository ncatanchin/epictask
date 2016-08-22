/// <reference path="./reflect-metadata/index.d.ts" />
/// <reference path="./material-ui/index.d.ts" />
/// <reference path="./webpack-env.d.ts" />
/// <reference path="./element-class.d.ts" />
/// <reference path="./lodash-mixins.d.ts" />
/// <reference path="./react-hotkeys.d.ts" />
/// <reference path="./short-id.d.ts" />
/// <reference path="./typescript-ioc.d.ts" />
/// <reference path="./reselect.d.ts" />

// UI MODS
interface Window {
	devToolsExtension:any
}

declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
	}
}

// Import the ProcessType enum
import ProcessType from 'shared/ProcessType'

/**
 * Process type of the currently running process
 */
declare var processType:ProcessType

/**
 * Is the current process the state server
 */
declare var isStateServer:boolean

/**
 * Is in development mode
 */
declare var isDev:boolean


