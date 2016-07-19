const webpack = require('webpack')
const assert = require('assert')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	const entries = {
		"MaterialUIEntry": ['material-ui','material-ui/svg-icons'],
		// "Libs": ['reflect-metadata','typedux','typemutant','typestore','typestore-plugin-pouchdb'],
		"UIEntry": ['babel-polyfill', "./src/ui/UIEntry"],
		"DatabaseServerEntry": ['babel-polyfill','./src/main/db/DatabaseServerEntry.ts']
	}

	// In DEV add the UIDevEntry
	// if (isDev) {
	// 	entries.UIDevEntry =  ['babel-polyfill', "./src/ui/UIDevEntry"]
	// }

	return Object.assign(config, {

		entry: entries,

		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist/`
		} : {}),

		plugins: [
			new webpack.optimize.CommonsChunkPlugin({
				name: "MaterialUIEntry",
				chunks:["UIEntry"]
			}),

			...config.plugins,
			new webpack.DefinePlugin({
				'process.env.PROCESS_TYPE': JSON.stringify('renderer')
			})

		],

		target: 'electron-renderer'
	})
}
