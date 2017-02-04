import "./LogDebugConfig"
import { getValue, isNil, isDefined } from "typeguard"

function hasFlag(arg) {
	return getValue(() => process.argv,[]).includes(arg) || isDefined(process.env[arg])
}

const
	_ = require('lodash'),
	path = require('path'),
	isDev = DEBUG || process.env.NODE_ENV === 'development' || hasFlag('--debug'),
	isRemote = typeof process.env.REMOTE !== 'undefined',
	skipSplash = hasFlag('SKIP_SPLASH'),
	isMac = process.platform === 'darwin',
	isWin32 = process.platform === 'win32',
	isLinux = !isMac && !isWin32,
	isRenderer = typeof window !== 'undefined' || process.type === 'renderer',
	isMain = process.type === 'browser',
	isTest = [true,'true'].includes(process.env.EPIC_TEST),
	envName =  _.toLower(process.env.NODE_ENV || (isDev ? 'dev' : 'production')),
	DebugWindowOpen = hasFlag('--debug-window-open')


const
	Config = require('epic-config')()

//DEBUG_LOG(`Parsed Config`, Config)

// SET POUCH MODULE
process.env.POUCH_MODULE_NAME = isTest ?
	'pouchdb' :
	Config.PouchModule || 'pouchdb-browser'

export const EnvGlobal = {
	version: VERSION,
	DebugWindowOpen,
	Config,
	LocalConfig: LOCAL_CONFIG,
	EnableDebug: !isNil(process.env.EPIC_DEBUG),
	skipSplash,
	envName,
	isMac,
	isWin32,
	isLinux,
	isDev,
	isDebug: isDev,
	isHot: !_.isNil(process.env.HOT),
	isTest,
	isRemote,
	isRenderer,
	isMain,
	isElectron: getValue(() => !isNil(require('electron').ipcRenderer || require('electron').ipcMain),false) &&  ['browser','renderer'].includes(process.type),
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