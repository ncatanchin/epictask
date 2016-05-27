///<reference path="custom/material-ui/index.d.ts"/>

/**
 * Extend window
 */
interface Window {
	devToolsExtension:Function
	__DEV__:boolean
	oauth2Callback:any
}

declare enum AppStateType {
	Login = 1,
	VerifyLogin,
	Ready
}

declare namespace NodeJS {
	export interface Global {
		hotReload:boolean
		__DEV__:boolean
	}
}