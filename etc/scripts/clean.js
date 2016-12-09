#!/usr/bin/env node
require('./init-scripts')

echo(`Cleaning`)
rm('-Rf','dist/*','dist')
//process.env.HOME + '/Library/Application Support/Electron/epic*'
