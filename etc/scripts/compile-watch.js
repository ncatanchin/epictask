#!/usr/bin/env node
require('./init-scripts')
// ./etc/scripts/configure-dev-env.sh

// #./etc/scripts/notify-on-error.sh

// # Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
// #exec > >(tee -i logs/compile.log)
// #exec 2>&1

Object.assign(process.env,{
	HOT:1,
	DEBUG:1,
	NODE_ENV:'development',
	COLOR: 0,
	COLORS: 0
})

require('shelljs/global')

const
	path = require('path')
	
	
	

prepareDirs()

mkdir('-p',path.resolve(process.cwd(),'dist/.awcache'))
exec(`node --max-old-space-size=4000 ${webpackCmd} --config etc/webpack/webpack.config.js --watch --display-error-details`)

//exec(`${gulpCmd} compile-watch`)

//exec('node --max-old-space-size=1500 ./node_modules/gulp/bin/gulp.js compile-watch')
