const path = require('path')

const cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

global.baseDir = path.resolve(__dirname)

// const del = require('del')
//
// del(['.awcache/**/*.*','dist'])

// Load the global common runtime for build/test/tools
require('./etc/tools/global-env')

/**
 * Load auxiliary tasks
 */

require('./etc/gulp/tasks')







