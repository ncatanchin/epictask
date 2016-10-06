#!/usr/bin/env node

require('shelljs/global')

const
	{process} = global


echo(`Cleaning`)
exec('rm -Rf dist/* .awcache')

echo("Starting Compilation")
process.env.NODE_ENV='production'
exec('echo NODE_ENV = ${NODE_ENV}')
if (exec('NODE_ENV=production gulp compile').code !== 0) {
	console.error(`compile FAILED`)
	exit(1)
}


echo("Copy resources")
mkdir('-p','dist/app/bin')
cp('bin/epictask-start.js','dist/app/bin')


let
	platforms = [process.platform === 'darwin' ? '--mac' : process.platform === 'win32' ? '--win' : '--linux']



echo("Packaging")
exec(`./node_modules/.bin/build ${platforms.join(' ')}`)