///<reference path="custom/material-ui/index.d.ts"/>

/**
 * Extend window
 */
interface Window {
	devToolsExtension:Function
	__DEV__:boolean
}


declare namespace NodeJS {
	export interface Global {
		hotReload:boolean
		__DEV__:boolean
	}
}