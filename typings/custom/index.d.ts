
/// <reference path="./reflect-metadata/index.d.ts" />
/// <reference path="./material-ui/index.d.ts" />
/// <reference path="./webpack-env.d.ts" />
/// <reference path="./element-class.d.ts" />
/// <reference path="./lodash-mixins.d.ts" />
/// <reference path="./short-id.d.ts" />
/// <reference path="./typescript-ioc.d.ts" />
/// <reference path="./reselect.d.ts" />
/// <reference path="./reactotron.d.ts"/>



declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
	}
}

/**
 * No webpack mode
 */
declare let __NO_WEBPACK__:boolean


/**
 * Is in development mode
 */
declare let isDev:boolean

// GLOBALS
// import ReactGlobal from 'react'
// import RadiumGlobal from 'radium'
import {install} from 'source-map-support'

/**
 * Source Map Support
 */
interface NodeRequireFunction {
	(moduleName: 'source-map-support'): typeof install;
}


//
//
// declare let React:typeof ReactGlobal
// declare let Radium:typeof RadiumGlobal
// declare let $:any