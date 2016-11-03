///<reference path="./LoDashMixins.ts"/>
///<reference path="./Globals.ts"/>
///<reference path="./Env.ts"/>
///<reference path="./PromiseConfig.ts"/>
import './SourceMapSupport'
import "./LogCategories"
import "./ProcessConfig"

Object.assign(global, {
	polyfillRequire(r) {
		if (!r.ensure)
			r.ensure = (deps, fn) => fn(r)
	}
})


const
	{ProcessType,ProcessConfig} = global as any,
	TypeLogger = require('typelogger'),
	processType = ProcessType[ process.env.EPIC_ENTRY ] || ProcessType.Main

ProcessConfig.setType(processType)
TypeLogger.setPrefixGlobal(`(${ProcessConfig.getTypeName()}Proc)`)


import "./Env"
import "./NamespaceConfig"
import "./PromiseConfig"
import "./LogConfig"
import "./Globals"
import "./EventHub"
import './NotificationCenter'

// HMR ACCEPT
if (module.hot) {
	module.hot.accept()
}

// EMPTY EXPORT
export {
	
}
