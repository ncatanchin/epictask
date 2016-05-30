///<reference path="custom/material-ui/index.d.ts"/>
///<reference path="../node_modules/urlsearchparams/types/webidl.d.ts"/>
///<reference path="../node_modules/urlsearchparams/types/utf8-encoding.d.ts"/>
///<reference path="../node_modules/urlsearchparams/urlsearchparams.d.ts"/>


/**
 * Extend window
 */
interface Window {
	devToolsExtension:Function
	__DEV__:boolean
	oauth2Callback:any
}

declare enum AppStateType {
	AuthLogin = 1,
	AuthVerify,
	Ready
}

declare namespace NodeJS {
	export interface Global {
		hotReload:boolean
		__DEV__:boolean
	}
}