import "epic-global/LogCategories"
import "epic-global/ProcessConfig"

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


import "epic-global/Env"
import "epic-global/NamespaceConfig"
import "epic-global/PromiseConfig"
import "epic-global/LogConfig"
import "epic-global/Globals"


// HMR ACCEPT
if (module.hot) {
	module.hot.accept()
}

// EMPTY EXPORT
export {
	
}
