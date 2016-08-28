
import './LoDashMixins'
import './ProtoExts'

export * from './ContextUtils'
export * from './Files'
export * from './JSONUtil'
export * from './ObjectUtil'

import * as ContextMod from './ContextUtils'
import * as JSONMod from './JSONUtil'
import * as FilesMod from './Files'
import * as ObjectsMod from './ObjectUtil'


const AllUtils = {
	Context:ContextMod,
	JSON:JSONMod,
	Files:FilesMod,
	Objects:ObjectsMod
}

// Declare global utils
declare global {
	namespace epictask {
		const util:typeof AllUtils
	}
}

extendEpicTaskNS({
	util: AllUtils
})