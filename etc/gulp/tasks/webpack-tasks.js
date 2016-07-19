require ('./../../webpack/parts/stats.js')
const path = require('path')
const fs = require('fs')
const gutil = require('gulp-util')
const babel = require('gulp-babel')
const webpack = require('webpack')
const express = require('express')
const makeSrcGlobs = require('../../tools/project-srcs')

const srcs = makeSrcGlobs()



/**
 * Run all compile tasks sequentially
 */
function makeWebpackCompile(projectConfig,watch = false) {
	return (done) => {

		const wpConfig = projectConfig.webpackConfigFn()
		const compiler = webpack(wpConfig)

		function doCallback(err,stats) {
			if (projectConfig.onCompileCallback)
				projectConfig.onCompileCallback(err,stats,watch)
		}

		if (watch) {
			compiler.watch({},webpackComplete((err,stats) => {
				if (err) {
					log.error('an error occurred', err)
					return
				}
				log.info(`Compilation completed for ${wpConfig.name} - in watch mode`)

				doCallback(err,stats)
			}))
		} else {
			// Execute single build
			compiler.run(webpackComplete((err,stats) => {
				log.info(`Compilation completed for ${wpConfig.name}`)

				 doCallback(err,stats)
				 done(err)
			}))
		}


	}
}


const DevDefaults = {
	port: 4444,
	hostname: 'localhost',
	https: false
}

/**
 * Standardized callback creator for
 * webpack compiler
 *
 * @param callback
 * @returns {Function}
 */
function webpackComplete(callback) {
	return function (err, stats) {
		if (err) {
			console.error("Error occurred", err)
		}

		log.info("[webpack] Completed", (stats) ? stats.toString(WebpackStatsConfig) : null, err)

		if (err && !err.toJson) {
			if (env !== 'development')
				throw new (gutil.PluginError)('webpack', err)

			log.error("Webpack Compilation failure",err)
		}

		var {errors, warnings} = stats.toJson()
		if (errors) {
			errors.forEach(log.error.bind(log))
		}
		if (warnings) {
			warnings.forEach(log.warn.bind(log))
		}

		if (typeof callback === "function") {
			return callback(err, stats)
		}
	}
}

/**
 * Local dev server
 *
 * @param port
 * @param projectConfig
 * @param wpConfig
 */
function runDevServer(port,projectConfig,wpConfig) {

	let firstRun = true, devMiddleware = null

	const compiler = webpack(wpConfig, webpackComplete((err,stats) => {

		if (firstRun) {
			console.log('First run complete, invalidating')
			devMiddleware.invalidate()
			firstRun = false
		}

		if (projectConfig.onCompileCallback)
			projectConfig.onCompileCallback(err,stats)
	}))

	const serverApp = express()

	// Create the dev middleware
	const webpackDevMiddleware = require('webpack-dev-middleware')
	devMiddleware = webpackDevMiddleware(compiler,{
		publicPath: wpConfig.output.publicPath,
		stats: WebpackStatsConfig
	})

	serverApp.use(devMiddleware)

	// Now the HMR middleware
	const
		webpackHotMiddleware = require('webpack-hot-middleware'),
		hotMiddleware = webpackHotMiddleware(compiler)

	serverApp.use(hotMiddleware)

	// Now server any static assets
	serverApp.use('/dist',express.static(path.resolve(baseDir,'dist')))

	// Add node specifically for source mappings
	serverApp.use('/dist',express.static('/Users/jglanz/Development/oss/node-6.1.0/lib'))
	// serverApp.use('/react-devtools',express.static('/Users/jglanz/Downloads/0.14.10_0'))
	//electron.BrowserWindow.addDevToolsExtension("/Users/jglanz/Downloads/0.14.10_0")

	const homePath = process.env.HOME
	gutil.log('Using home path',homePath)
	serverApp.use(homePath,express.static(homePath))

	serverApp.listen(port,'0.0.0.0', err => {
		if (err) {
			console.error(`Failed to start dev server`, err)
			return
		}

		console.log(`Dev server is listening on port ${port}`)
	})
}

/**
 * Create a gulp task that runs a local dev server
 *
 * @param projectConfig
 * @returns {Function}
 */
function makeWebpackDevServer(projectConfig) {
	log.info('Making dev server task for',projectConfig.name,projectConfig)
	return (done) => {

		const wpConfig = projectConfig.webpackConfigFn()
		//const wpConfig = projectConfig.webpackConfig
		let {hostname,port,https} = Object.assign({},DevDefaults,projectConfig)

		const
			host = `${hostname}:${port}`,
			proto = https === true ? 'https' : 'http',
			url = `${proto}://${host}`


		// Add webpack-dev-server to all entries
		function addHotClient(entry) {
			entry.unshift(`webpack-hot-middleware/client?path=${url}/__webpack_hmr`)
		}

		if (wpConfig.dev) {
			Object.keys(wpConfig.entry).forEach(name => {
				addHotClient(wpConfig.entry[name])
			})

		}

		runDevServer(projectConfig.port,projectConfig,wpConfig)

	}
}

function makeCompileTask(projectConfig) {
	log.info('Making compile task for',projectConfig.name,projectConfig)
	return (done) => {
		return makeWebpackCompile(projectConfig, false)(done)
	}
}

function makeDevTask(projectConfig) {
	log.info('Making dev task for',projectConfig.name,projectConfig)
	return (done) => {
		switch (projectConfig.runMode) {
			case RunMode.DevServer:
				return makeWebpackDevServer(projectConfig)(done)
			case RunMode.Watch:
				return makeWebpackCompile(projectConfig, true)(done)
			default:
				throw new Error('Unknown run mode')

		}
	}
}

const allTaskNames = {}

function makeTaskNames(projectConfig) {
	return ['dev','compile','release']
		.reduce((taskNames,taskName) => {
			taskNames[taskName] = `${taskName}-${projectConfig.name}`
			allTaskNames[taskName] = allTaskNames[taskName] || []
			allTaskNames[taskName].push(taskNames[taskName])
			return taskNames
		}, {})
}

_.each(projectConfigs,projectConfig => {

	assert(projectConfig.runMode, `Project runmode is required ${projectConfig.name}`)

	const taskNames = makeTaskNames(projectConfig)
	log.info(`Making tasks for project ${projectConfig.name}: ${taskNames}`)
	gulp.task(taskNames.dev,[],makeDevTask(projectConfig))
	gulp.task(taskNames.compile,[],makeCompileTask(projectConfig))
})

// //log.info('All dynamic task names',allTaskNames)
// gulp.task('dll',[],(done) => {
// 	const dllConfig = require('../../webpack/webpack.config.dll')()
// 	const compiler = webpack(dllConfig)
//
// 	// Execute single build
// 	compiler.run(webpackComplete((err,stats) => {
// 		log.info(`Compilation completed for DLL`)
//
// 		done(err)
// 	}))
// })

//const materialUiSrcs = ['./libs/material-ui/src/**/*.*','!./libs/material-ui/src/**/*.spec.js']
//
// gulp.task('compile-material-ui',() => {
// 	log.info('Starting compile material-ui')
// 	return gulp.src(materialUiSrcs)
// 		.pipe(babel(JSON.parse(fs.readFileSync('./libs/material-ui/.babelrc'))))
// 		.pipe(gulp.dest('./libs/material-ui/build/'))
// })
//
// gulp.task('compile-material-ui-watch',['compile-material-ui'],(done) => {
// 	log.info('Starting watch material-ui')
// 	const watcher = gulp.watch(materialUiSrcs, ['compile-material-ui'])
// 	watcher.on('change',(event) => {
// 		log.info('Files changed in material-ui, compiling',event)
// 	})
// })

gulp.task('dev',[],(done) => {
	log.info("Starting all dev tasks: " + allTaskNames.dev.join(', '))
	runSequence(allTaskNames.dev)
})

gulp.task('compile',[],(done) => {
	log.info("Starting all compile tasks: " + allTaskNames.compile.join(', '))
	runSequence(allTaskNames.compile,done)
})

gulp.task('compile-watch',['dev'])
gulp.task('clean-dev',['clean'], (done) => {
	runSequence('dev',done)
})
