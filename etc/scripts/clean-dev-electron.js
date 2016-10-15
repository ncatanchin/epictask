#!/usr/bin/env node
require('./init-scripts')

const
	path = require('path'),
	{process} = global,
	electronRoot = path.resolve(process.env.HOME,'Library','Application Support','Electron')

echo(`Cleaning ${electronRoot}`)
cd(electronRoot)
rm(
	'-rf',
	'Cookies*',
	'epictask*',
	path.resolve(electronRoot,'Local Storage') + '/https_github*'

)
