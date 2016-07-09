const path = require('path')

const cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill

global.baseDir = path.resolve(__dirname)


// Load the global common runtime for build/test/tools
require('./etc/tools/global-env')
require('./etc/gulp/tasks')







