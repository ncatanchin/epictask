// require('v8-debug')
// require('v8-profiler')
// const electron = require('electron')
// const proc = require('child_process')
//
// proc.spawn(electron)
//require('source-map-support').install()
//require('source-map-support/register')

// console.log('starting epictask: ' + process.cwd())
// require('babel-polyfill')
//

//
// /**
//  * Replace es6-promise with bluebird
//  */
// const Bluebird = require('bluebird')
//
// Bluebird.config({
// 	cancellation: true,
// 	longStackTraces: true,
// 	warnings: {
// 		wForgottenReturn: false
// 	},
// 	monitoring: true
// })
//
// //global.Promise = Bluebird
// require('babel-runtime/core-js/promise').default = Bluebird


/**
 * No load the main entry
 */

//process.env.NODE_PATH = `${process.cwd()}/node_modules:${process.env.NODE_PATH}`
process.env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'
const
	Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: true,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: true
})

const
	appPaths = [
		'../dist/app',
		'../app',
		'..',
		'.',
		'../../../app'
	]



let
	outBuf = '',
	resolvedAppPath = null,
	fs = require('fs')

const logOut = (...args) => {
	outBuf += args.join(' // ') + '\n'
}

for (let appPath of appPaths) {
	try {
		appPath = require.resolve(`${appPath}/AppEntry.bundle`)
		
		if (fs.existsSync(appPath)) {
			resolvedAppPath = appPath
			logOut(`Found at ${resolvedAppPath}`)
			break
		}
	} catch (err) {
		logOut(`Failed to find at path ${appPath} ${err.message} ${err}`)
	}
}

if (resolvedAppPath) {
	require(resolvedAppPath)
} else {
	require('fs').writeFileSync('/tmp/epicinfo',`Starting ${__dirname}/${__filename}/
	${require('electron').app.getPath('exe')}/${process.cwd()}/${process.env.NODE_ENV}:\n${JSON.stringify(process.env,null,4)}

	${outBuf}
`)
	process.exit(0)
}



//
