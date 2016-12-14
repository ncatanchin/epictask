export * from './Command'
export * from './CommandAccelerator'

export * from './CommandManager'
import {getCommandManager} from './CommandManager'
export * from './CommandSimpleMenuManager'
export * from './CommandContainerConfig'

import accelDataSource from './CommandAcceleratorStoreDataSource'
getCommandManager().setAcceleratorDataSource(accelDataSource)

// import * as CommandComponents from './CommandComponent'
//
//
// import {
// 	CommandComponent,
// 	CommandRoot,
// 	CommandContainerBuilder
// }
//
// export * from './CommandComponent'