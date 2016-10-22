#!/usr/bin/env node
require('./init-scripts')


const
	path = require('path'),
	fs = require('fs'),
	_ = require('lodash'),
	{isMac,isLinux,isWindows,process} = global,
	
	doInstall = process.argv.includes('--install'),
	doWin = process.argv.includes('--win'),
	doLinux = process.argv.includes('--linux'),
	buildCmd = path.join(process.cwd(),'node_modules','.bin',`build${isWindows ? '.cmd' : ''}`)

echo(`Will use builder @ ${buildCmd}`)

const
	skipBuild = false


process.env.NODE_ENV = 'production'

if (!skipBuild) {
	require('./clean')
	
	echo("Starting Compilation")
	
	
	if (exec(`gulp compile`).code !== 0) {
		echo(`compile FAILED`)
		process.exit(0)
	}
	
	echo("Copy resources")
	mkdir('-p', 'dist/app/bin')
	
}

cp('bin/epictask-start.js', 'dist/app/bin')


const
	pkg = require('../../package.json'),
	appPkg = _.pick(pkg,'name','version','description','author','main','dependencies')

echo(`Tweaking package config`)
echo('material-ui tweak')
//appPkg.dependencies['material-ui'] = "../../../material-ui"

// WRITE APP PKG
fs.writeFileSync(
	'dist/app/package.json',
	JSON.stringify(appPkg,null,2)
)

let
	platforms = [
		isMac ?
			'--mac' :
			isWindows ?
				'--win' :
				'--linux'
	]


echo("Packaging")


// OPTIONALLY BUILD OTHER
execNoError(`${buildCmd} ${platforms.join(' ')}`)

require('./package-dev')(doWin,doLinux)

doInstall && require('./install-app')


require('./publish-artifacts')
