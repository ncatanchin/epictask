require ('./webpack.stats')
const path = require('path')
const fs = require('fs')
const gutil = require('gulp-util')
const webpack = require('webpack')
const express = require('express')

const makeSrcGlobs = require('../../tools/project-srcs')
const named = require('vinyl-named')

const srcs = makeSrcGlobs()

/**
 * Project configuration
 */
const projectConfigs = require('../../projects')

/**
 * Run all compile tasks sequentially
 */
function makeWebpackCompile(projectConfig,watch = false) {
	return function(done) {
		const wpConfig = projectConfig.webpackConfig
		
		const compiler = webpack(wpConfig)

		function doCallback(err,stats) {
			if (projectConfig.onCompileCallback)
				projectConfig.onCompileCallback(err,stats,watch)
		}

		if (watch) {
			compiler.watch({},webpackComplete((err,stats) => {
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
 * @param wpConfig
 */
function runDevServer(port,projectConfig) {

	const
		wpConfig = projectConfig.webpackConfig,
		compiler = webpack(wpConfig, webpackComplete(projectConfig.onCompileCallback))
	
	const serverApp = express()
	const
		webpackDevMiddleware = require('webpack-dev-middleware'),
		devMiddleware = webpackDevMiddleware(compiler,{
			publicPath: wpConfig.output.publicPath,
			stats: WebpackStatsConfig
		})

	serverApp.use(devMiddleware)


	const webpackHotMiddleware = require('webpack-hot-middleware')
	serverApp.use(webpackHotMiddleware(compiler))


	serverApp.listen(port,'0.0.0.0', err => {
		if (err) {
			console.error(`Failed to start dev server`, err)
			return
		}
		devMiddleware.invalidate()
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
	return function(done) {
		
		const wpConfig = projectConfig.webpackConfig
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
			Object.keys(wpConfig.entry)
				.forEach(name => addHotClient(wpConfig.entry[name]))
		}
		
		runDevServer(projectConfig.port,projectConfig)

	}
}

function makeDevTask(projectConfig) {
	switch (projectConfig.runMode) {
		case RunMode.DevServer:
			return makeWebpackDevServer(projectConfig)
		case RunMode.Watch:
			return makeWebpackCompile(projectConfig,true)
	}

	throw new Error('Unknown run mode')
}

const allTaskNames = {}

function makeTaskNames(projectConfig) {
	return ['dev','build','release']
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
	//log.info(`Making tasks: ${taskNames}`)
	gulp.task(taskNames.dev,[],makeDevTask(projectConfig))
})

//log.info('All dynamic task names',allTaskNames)

gulp.task('dev',[],(done) => {
	log.info("Starting all dev tasks: " + allTaskNames.dev.join(', '))
	runSequence(allTaskNames.dev)
})

