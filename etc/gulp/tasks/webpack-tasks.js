require ('./webpack.stats')
const path = require('path')
const fs = require('fs')
// const merge = require('merge2')
// const sourceMaps = require('gulp-sourcemaps')
const gutil = require('gulp-util')
const webpackStream = require('webpack-stream')
const webpack = require('webpack')
const express = require('express')
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')



const named = require('vinyl-named')
const
	makeSrcGlobs = require('../../tools/project-srcs'),
	{makeBabelConfig} = require('../babel-config')




// Create paths
const
	distPath = `${processDir}/dist`,
	srcPath = `${processDir}/src`

const srcs = makeSrcGlobs()

/**
 * Project configuration
 */
const projectConfigs = require('../../projects')

/**
 * Run all compile tasks sequentially
 */
function makeWebpackCompile(config,watch = false,onCompileCallback) {
	return function(done) {
		const compiler = webpack(config)

		function doCallback(err,stats) {
			if (onCompileCallback)
				onCompileCallback(err,stats)
		}

		if (watch) {
			compiler.watch({},webpackComplete((err,stats) => {
				log.info(`Compilation completed for ${config.name} - in watch mode`)

				doCallback(err,stats)
			}))
		} else {

			// Execute single build
			compiler.run(webpackComplete((err,stats) => {
				log.info(`Compilation completed for ${config.name}`)
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

const env = process.env.NODE_ENV || 'development'

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

function makeWebpackDevTask(config) {
	return function(done) {

		let {hostname,port,https} = DevDefaults

		const WebpackDevServer = require('webpack-dev-server')
		let configs = config
		if (!Array.isArray(configs))
			configs = [configs]

		const
			host = `${hostname}:${port}`,
			proto = https === true ? 'https' : 'http',
			url = `${proto}://${host}`


		// Add webpack-dev-server to all entries
		function addHotClient(entry) {
			//, 'webpack/hot/dev-server'
			//entry.unshift(`webpack-dev-server/client?${url}`,'webpack/hot/dev-server')
			entry.unshift(`webpack-hot-middleware/client?path=http://localhost:${port}/__webpack_hmr`)
		}

		configs
			.filter(config => config.dev)
			.forEach(config => {
				Object.keys(config.entry)
					.forEach(name => addHotClient(config.entry[name]))
			})


		configs = (Array.isArray(configs)) ? configs : [configs]
		_.each(configs[0].entry,addHotClient)

		const compiler = webpack(configs, webpackComplete())
		const serverApp = express()
		serverApp.use(webpackDevMiddleware(compiler,{
			publicPath: config.output.publicPath,
			stats: { color: true }
		}))

		serverApp.use(webpackHotMiddleware(compiler))


		serverApp.listen(port,'0.0.0.0', err => {
			if (err) {
				console.error(`Failed to start dev server`, err)
				return
			}

			console.log(`Dev server is listening on port ${port}`)
		})

		// Create the dev server
		// const devServerConfig = {
		// 	historyApiFallback: true,
		// 	publicPath: '/',
		// 	hot: true,
		// 	debug: true,
		// 	keepAlive: true,
		// 	host: "0.0.0.0",
		// 	contentBase: path.resolve(`${baseDir}/dist`),
		// 	// Stats - i dont think this is used
		// 	stats: WebpackStatsConfig
		// }
		//
		// // SSL
		// if (https) {
		// 	Object.assign(devServerConfig, {
		// 		https,
		// 		ca: file('etc/ssl/getrads-signed/getrads.ca-bundle'),
		// 		cert: file('etc/ssl/getrads-signed/STAR_getrads_com.crt'),
		// 		key: file('etc/ssl/getrads.key')
		// 	})
		// }
		//
		// const server = new WebpackDevServer(compiler, devServerConfig)
		//
		//
		// //And start listening
		// server.listen(port,devServerConfig.host, (err) => {
		// 	log.info("Started webpack dev server", err)
		// 	if (err)
		// 		throw new (gutil.PluginError)('webpack-dev-server', err)
		//
		// 	log.info('[webpack-dev-server]', `${url}/index.html`)
		// })
	}
}


gulp.task('serve-dev-electron-renderer', [], makeWebpackDevTask(projectConfigs['electron.renderer'].webpackConfig))


let electronMainStarted = false
gulp.task('compile-watch-dev-electron-main', [], makeWebpackCompile(
	projectConfigs['electron.main'].webpackConfig,
	true,
	(err,stats) => {
		if (err)
			return

		if (!electronMainStarted) {
			// if (exec(`./node_modules/.bin/cross-env HOT=1 NODE_ENV=development ./node_modules/.bin/electron ./dist/main-entry.js`) !== 0) {
			// 	log.error('failed to start electron main')
			// } else {
			// 	electronMainStarted = true
			// 	log.info('Electron main started')
			// }

		}
	})
)
