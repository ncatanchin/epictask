const webpack = require('webpack')
const assert = require('assert')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	const entries = {
		"DatabaseServerEntry": ['./src/main/db/DatabaseServerEntry.ts']
	}

	return _.assign(config, {

		entry: entries,

		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist/`
		} : {}),


		target: 'electron-renderer'
	})
}
