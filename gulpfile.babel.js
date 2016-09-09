require('source-map-support').install()

const path = require('path')

const cleanExit = function() { process.exit() };
process.on('SIGINT', cleanExit); // catch ctrl-c
process.on('SIGTERM', cleanExit); // catch kill


global.baseDir = path.resolve(__dirname)

// Load Env
require('./etc/tools/global-env')

// Load Tasks
require('./etc/gulp/tasks')







