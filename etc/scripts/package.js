#!/usr/bin/env node
require('./init-scripts')


const
	path = require('path'),
	{isMac,isLinux,isWindows,process} = global,
	
	doInstall = process.argv.includes('--install'),
	doWin = process.argv.includes('--win'),
	doLinux = process.argv.includes('--linux'),
	buildCmd = path.join(process.cwd(),'node_modules','.bin',`build${isWindows ? '.cmd' : ''}`)

echo(`Will use builder @ ${buildCmd}`)

const
	skipBuild = false

if (!skipBuild) {
	require('./clean')
	
	echo("Starting Compilation")
	process.env.NODE_ENV = 'production'
	
	if (exec(`gulp compile`).code !== 0) {
		echo(`compile FAILED`)
		process.exit(0)
	}
	
	echo("Copy resources")
	mkdir('-p', 'dist/app/bin')
	cp('bin/epictask-start.js', 'dist/app/bin')
}

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
	if (doWin) {
		echo(`Packaging on Windows`)
		require('./package-win-remote')
	}
	
	if (doLinux) {
		echo(`Packaging on Linux`)
		require('./package-linux-remote')
	}
	
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
