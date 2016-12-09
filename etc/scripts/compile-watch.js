#!/usr/bin/env node
require('./init-scripts')

devEnv()

require('shelljs/global')

const
	path = require('path')

prepareDirs()


exec(`node --max-old-space-size=4000 ${webpackCmd} --config etc/webpack/webpack.config.js --watch --display-error-details`)

//exec(`${gulpCmd} compile-watch`)

//exec('node --max-old-space-size=1500 ./node_modules/gulp/bin/gulp.js compile-watch')
