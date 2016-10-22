
const
	{env} = process

/**
 * ENV CONFIG
 */
env.BLUEBIRD_W_FORGOTTEN_RETURN = '0'
if (!env.NODE_ENV) {
	env.NODE_ENV = 'production'
}

/**
 * CONFIGURE PROMISES FIRST
 */
const
	Bluebird = require('bluebird')

Bluebird.config({
	cancellation: true,
	longStackTraces: false,
	warnings: {
		wForgottenReturn: false
	},
	monitoring: env.NODE_ENV === 'development'
})

/**
 * APP SEARCH PATHS FOR ASAR
 */
const
	APP_SEARCH_PATHS = [
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

for (let appPath of APP_SEARCH_PATHS) {
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
		${require('electron').app.getPath('exe')}/${process.cwd()}/${env.NODE_ENV}:\n${JSON.stringify(process.env,null,4)}
	
		${outBuf}
	`

if (resolvedAppPath) {
	require(resolvedAppPath)
} else {
	try {
		require('../AppEntry.bundle')
	} catch (err) {
		try {
			require('fs').writeFileSync('/tmp/epicinfo', errInfo)
		} catch (err) {}
		console.error(errInfo)
		console.error(`NOTHING WORKED`,err)
		process.exit(0)
		
	}
	
}



//
