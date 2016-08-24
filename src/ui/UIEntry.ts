import 'reflect-metadata'
import 'shared/LogConfig'

import 'shared/RendererLogging'
import 'shared/PromiseConfig'

// Load all global/env stuff first
// LOGGING CONFIG FIRST
import './UIGlobals'

// Set process type
ProcessConfig.setType(ProcessConfig.Type.UI)


import './UIConfigurator'


export {

}
