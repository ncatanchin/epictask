#!/usr/bin/env node
require('./init-scripts')

echo(`Cleaning`)
rm('-rf','dist/*','.awcache/*')