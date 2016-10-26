require('source-map-support').install()
require('babel-polyfill')
require('reflect-metadata')

const
	noWebpack = ['true','1','on'].includes(process.env.NO_WEBPACK || '')



if (noWebpack) {
	require('./epictask-polyfill-webpack')
} else {
	Object.assign(global,{
		__NO_WEBPACK__: false
	})
}


/**
 * APP SEARCH PATHS FOR ASAR
 */
const
	{env} = process,
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
	fs = require('fs'),
	path = require('path')

const logOut = (...args) => {
	outBuf += args.join(' // ') + '\n'
	console.log(...args)
}

for (let appPath of APP_SEARCH_PATHS) {
	try {
		appPath = require.resolve(`${appPath}/epic-entry-main`)
		
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
	const
		dir = path.dirname(resolvedAppPath)
	
	
	logOut(`Loading main`)
	// const
	// 	commonOut = require(path.resolve(dir,"epic_libs")),
	// 	mainOut =
	require(resolvedAppPath)
	
	logOut(`Loading common`)
	
	
	
	
	
	
} else {
	try {
		
		//require('../epic-libs')
		require('../epic-entry-main')
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
