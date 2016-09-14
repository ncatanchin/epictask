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



declare namespace NodeJS {
	interface Global {
		MainBooted:boolean
	}
}

/**
 * Is in development mode
 */
declare var isDev:boolean


import {install} from 'source-map-support'

interface NodeRequireFunction {
	(moduleName: 'source-map-support'): typeof install;
}
