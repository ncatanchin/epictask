#!/usr/bin/env node

require('shelljs/global')

const
	path = require('path'),
	{process} = global,
	buildCmd = path.join(process.cwd(),'node_modules','.bin',`build${process.platform === 'win32' ? '.cmd' : ''}`)

echo(`Will use builder @ ${buildCmd}`)

echo(`Cleaning`)
rm('-rf','dist/*','.awcache/*')

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
	platforms = [process.platform === 'darwin' ? '--mac' : process.platform === 'win32' ? '--win' : '--linux']



echo("Packaging")

exec(`${buildCmd} ${platforms.join(' ')}`)