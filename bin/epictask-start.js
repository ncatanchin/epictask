
/**
 * No load the main entry
 */

process.env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'

const
	Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: false,
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

const
	errInfo = `Starting ${__dirname}/${__filename}/
		${require('electron').app.getPath('exe')}/${process.cwd()}/${process.env.NODE_ENV}:\n${JSON.stringify(process.env,null,4)}
	
		${outBuf}
	`

console.log(errInfo)

if (resolvedAppPath) {
	require(resolvedAppPath)
} else {
	
	require('fs').writeFileSync('/tmp/epicinfo',errInfo)
	try {
		require('../AppEntry.bundle')
	} catch (err) {
		console.error(`NOTHING WORKED`,err)
		process.exit(0)
		
	}
	
}



//
