

//import * as Electron from 'electron'

import { getValue, isNil } from "typeguard"

const
	_ = require('lodash'),
	path = require('path'),
	g = global as any,
	isDev = process.env.NODE_ENV === 'development',
	isRemote = typeof process.env.REMOTE !== 'undefined',
	skipSplash = !_.isNil(process.env.SKIP_SPLASH),
	isMac = process.platform === 'darwin',
	isWin32 = process.platform === 'win32',
	isLinux = !isMac && !isWin32,
	isRenderer = typeof window !== 'undefined' || process.type === 'renderer',
	isMain = process.type === 'browser',
	envName =  _.toLower(process.env.NODE_ENV || (isDev ? 'dev' : 'production')),
	MainEnv = getValue(() => !isMain && require('electron').remote.getGlobal('Env'),{}) as any


const
	Config = require('epic-config')()

if (DEBUG)
	console.log(`Parsed Config`, Config)

// SET POUCH MODULE
process.env.POUCH_MODULE_NAME = Config.PouchModule || 'pouchdb-browser'

const EnvGlobal = {
	Config,
	EnableDebug: !isNil(process.env.EPIC_DEBUG),
	skipSplash,
	envName,
	isMac,
	isWin32,
	isLinux,
	isDev,
	isDebug: isDev,
	isHot: !_.isNil(process.env.HOT),
	isTest: !_.isNil(process.env.EPIC_TEST),
	isRemote,
	isRenderer,
	isMain,
	isElectron: getValue(() => !isNil(require('electron')),false) &&  ['browser','renderer'].includes(process.type),
	isWebpack: !['true','1','on'].includes(process.env.NO_WEBPACK),
	
	baseDir: path.resolve(__dirname,'../..')
}

Object.assign(global as any,{
	Env:EnvGlobal,
	DEBUG: isDev
})

declare global {
	//noinspection JSUnusedLocalSymbols,ES6ConvertVarToLetConst
	var Env:typeof EnvGlobal
}

export default Env