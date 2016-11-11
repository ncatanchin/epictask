#!/usr/bin/env node
require('./init-scripts')

echo(`Cleaning`)
rm('-rf','dist/.aw*','dist/*','.awcache')
//process.env.HOME + '/Library/Application Support/Electron/epic*'
