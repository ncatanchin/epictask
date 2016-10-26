///<reference path="../epic-entry-shared/Globals.ts"/>
///<reference path="../epic-entry-shared/Env.ts"/>
///<reference path="../epic-entry-shared/PromiseConfig.ts"/>

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


// HMR ACCEPT
if (module.hot) {
	module.hot.accept()
}

// EMPTY EXPORT
export {
	
}
