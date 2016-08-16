const webpack = require('webpack')
const assert = require('assert')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	const entries = {
		"UIEntry": ["./src/ui/UIEntry"]
	}

	// In DEV add the UIDevEntry
	// if (isDev) {
	// 	entries.UIDevEntry =  ['babel-polyfill', "./src/ui/UIDevEntry"]
	// }

	return _.assign(config, {
		entry: entries,
		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist/`
		} : {}),

		target: 'electron-renderer'
	})
}
