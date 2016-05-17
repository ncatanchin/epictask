const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const webpack = require('webpack')
const assert = require('assert')
const path = require('path')

const baseDir = path.resolve(__dirname,'../..')

module.exports = (projectConfig) => {
	

	return {
		context: baseDir,

		stats: WebpackStatsConfig,
		output: {
			path: `${baseDir}/dist`,
			filename: '[name].js'
		},

		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: {
			alias: {
				assert: 'browser-assert'
			},
			modules: [
				path.resolve(baseDir, 'node_modules')
			],
			extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
			packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']

		},

		// Source maps support ('inline-source-map' also works)
		devtool: 'source-map',

		// Add the loader for .ts files.
		module: require('./parts/loaders')(projectConfig),

		plugins: [
			new ForkCheckerPlugin(),
			//new webpack.NoErrorsPlugin(),
			new webpack.DefinePlugin({
				__DEV__: isDev,
				'process.env': {
					NODE_ENV: JSON.stringify(env)
				}
			})
		]
	}



}

