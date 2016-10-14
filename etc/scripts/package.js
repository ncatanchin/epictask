#!/usr/bin/env node
require('./init-scripts')

const
	path = require('path'),
	{isMac,isLinux,isWindows,process} = global,
	
	doInstall = process.argv.includes('--install'),
	buildCmd = path.join(process.cwd(),'node_modules','.bin',`build${isWindows ? '.cmd' : ''}`)

echo(`Will use builder @ ${buildCmd}`)

require('./clean')

echo("Starting Compilation")
process.env.NODE_ENV='production'

if (exec('gulp compile').code !== 0) {
	console.error(`compile FAILED`)
	exit(1)
}


echo("Copy resources")
mkdir('-p','dist/app/bin')
cp('bin/epictask-start.js','dist/app/bin')


let
	platforms = [
		isMac ?
			'--mac' :
			isWindows ?
				'--win' :
				'--linux'
	]


echo("Packaging")



if (exec(`${buildCmd} ${platforms.join(' ')}`).code === 0) {
	if (doInstall) {
		install()
	}
}

function install() {
	echo(`Installing App`)
	if (isMac) {
		exec('pkill -9 Epictask')
		rm('-Rf', '/Applications/Epictask.app')
		cp('-r', 'dist/build/mac/Epictask.app', '/Applications/')
	}
}
