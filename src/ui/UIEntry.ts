import 'reflect-metadata'
require('shared/LogConfig')

import 'shared/RendererLogging'
import 'shared/PromiseConfig'

//require.ensure(['material-ui','material-ui/svg-icons'],(require) => {
// Load all global/env stuff first
// LOGGING CONFIG FIRST
require('./UIGlobals')
require('./UIConfigurator')
//})


export {

}
