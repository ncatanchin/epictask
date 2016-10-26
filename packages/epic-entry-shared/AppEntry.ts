import "./LogCategories"
import "./ProcessConfig"




// DEBUG HELPERS
// if (DEBUG) {
// 	Object.assign(global,{
// 		__webpack_require__
// 	})
// }


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
