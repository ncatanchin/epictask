#!/usr/bin/env node
require('./init-scripts')

echo(`Cleaning`)
rm('-Rf','dist/.aw*','dist/build','dist/out','dist/app','.awcache')
//process.env.HOME + '/Library/Application Support/Electron/epic*'
