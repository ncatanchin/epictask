#!/usr/bin/env node

// ./etc/scripts/configure-dev-env.sh

// #./etc/scripts/notify-on-error.sh

// # Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
// #exec > >(tee -i logs/compile.log)
// #exec 2>&1

Object.assign(process.env,{
	HOT:1,
	DEBUG:1,
	NODE_ENV:'development'
})

require('shelljs/global')
if (process.platform === 'win32')
	exec('node_modules\\.bin\\gulp.cmd compile-watch')
else
	exec('./node_modules/.bin/gulp compile-watch')
//exec('node --max-old-space-size=1500 ./node_modules/gulp/bin/gulp.js compile-watch')
