require('../tools/global-env')

const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const webpack = require('webpack')
const assert = require('assert')
const path = require('path')

const
	baseDir = path.resolve(__dirname,'../..'),
	distDir = `${baseDir}/dist`
const {DefinePlugin,HotModuleReplacementPlugin} = webpack

// Import globals - just for linting
const {isDev,env} = global

module.exports = function (projectConfig) {
	

	const config = {
		context: baseDir,

		stats: WebpackStatsConfig,
		output: {
			path: distDir,
			publicPath: `${distDir}/`,
			filename: '[name].js'
		},

		recordsPath: `${distDir}/_records`,

		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: {
			alias: {
				assert: 'browser-assert',
				shared: path.resolve(baseDir,'src/shared')
			},
			modules: [
				path.resolve(baseDir,'node_modules'),
				path.resolve(baseDir,'src')
			],
			modulesDirectories: [
				path.resolve(baseDir, 'node_modules')
			],
			extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
			packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']

		},

		// Add the loader for .ts files.
		module: require('./parts/loaders')(projectConfig),

		plugins: [
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.NoErrorsPlugin(),
			new ForkCheckerPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				'process.env': {
					NODE_ENV: JSON.stringify(env)
				}
			})
		],
		node: {
			__dirname: true,
			__filename: true
		}
	}
	
	// Development specific updates
	Object.assign(config,{

		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',

		// In development specify absolute path - better
		// debugger support
		output: Object.assign({},config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]"
		} : {}),

		
		

		debug: isDev,
		dev: isDev
	})

	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1,0,new HotModuleReplacementPlugin())


	return config

}

