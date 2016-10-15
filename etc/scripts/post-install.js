#!/usr/bin/env node

require('shelljs/global')

const
	fs = require('fs'),
	path = require('path'),
	pkg = require('../../package.json'),
	electronVersion = pkg.devDependencies['electron-prebuilt']

cd('node_modules/leveldown')
exec(`node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://atom.io/download/atom-shell`)
