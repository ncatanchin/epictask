#!/usr/bin/env node
require('./init-scripts')

echo(`Cleaning`)

for (let dir of ['dist/*', 'dist']) {
	try {
		rm('-Rf', dir)
	} catch (err) {
		log.warn(`Failed to delete ${dir}`, err)
	}
}

//process.env.HOME + '/Library/Application Support/Electron/epic*'
