/// <reference path="./reflect-metadata/index.d.ts" />
/// <reference path="./material-ui/index.d.ts" />
/// <reference path="./webpack-env.d.ts" />
/// <reference path="./element-class.d.ts" />
/// <reference path="./lodash-mixins.d.ts" />
/// <reference path="./react-hotkeys.d.ts" />
/// <reference path="./short-id.d.ts" />
/// <reference path="./typescript-ioc.d.ts" />
/// <reference path="./reselect.d.ts" />
/// <reference path="./reactotron.d.ts"/>

// UI MODS
interface Window {
	devToolsExtension:any
	
}

declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
		gsapRequire:any
	}
}


declare var gsapRequire:any

/**
 * Is in development mode
 */
declare var isDev:boolean


