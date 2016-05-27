const webpack = require('webpack')
const assert = require('assert')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	return Object.assign(config, {

		entry: {
			"AppEntry": ['babel-polyfill',"./src/app/AppEntry"]
		},

		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist`
		} : {}),

		plugins: config.plugins.concat([
			config.DLL.DllReferencePlugin
		]),

		externals:
		{
			debug: "commonjs debug",
			electron: 'commonjs electron',
			'source-map-support': 'commonjs source-map-support',
			'font-awesome': 'commonjs font-awesome',
			formidable: 'commonjs formidable',
			superagent: 'commonjs superagent',
			'any-promise': 'commonjs any-promise',
			'electron-is-dev': 'commonjs formidable',
			dns: 'commonjs dns',
			request: 'commonjs request',
			http: 'commonjs http',
		},

		// Mark a couple of simple externals
		// externals: [
		// 	{
		// 		debug: "''",
		// 		electron: 'commonjs electron'
		// 	},
		// 	'source-map-support',
		// 	'font-awesome'
		//
		//
		// ],

		//target: 'electron-renderer'
		target: require('webpack-target-electron-renderer')(config)
	})
}