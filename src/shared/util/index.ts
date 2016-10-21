import 'shared/NamespaceConfig'
import './LoDashMixins'

import './ProtoExts'

export * from './JSONUtil'
export * from './ObjectUtil'

export * from './EnumEventEmitter'

export * from './TypeCheckUtil'
export * from './IdUtil'
export * from './ListUtil'
export * from './ProxyUtil'

export * from './IdUtil'

//
// import * as ContextMod from './ContextUtils'
// import * as JSONMod from './JSONUtil'
// import * as ObjectsMod from './ObjectUtil'
//
//
// const AllUtils = {
// 	Context:ContextMod,
// 	JSON:JSONMod,
// 	Objects:ObjectsMod
// }
//
// // Declare global utils
// declare global {
// 	namespace epictask {
// 		const util:typeof AllUtils
// 	}
// }
//
// extendEpicTaskNS({
// 	util: AllUtils
// })