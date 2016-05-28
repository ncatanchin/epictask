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


		target: 'electron-renderer'
	})
}