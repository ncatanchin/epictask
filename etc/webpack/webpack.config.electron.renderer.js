const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')

module.exports = (projectConfig) => {
	const config = require('./webpack.config.dev')(projectConfig)

	return Object.assign(config, {

		entry: {
			"AppEntry": ["./src/app/AppEntry"]
		},

		target: 'electron-renderer',

		output: Object.assign(config.output, isDev ? {
			publicPath: 'http://localhost:4444/'
		} : {}),
		plugins: [
			...config.plugins,
			new webpack.HotModuleReplacementPlugin()
		],

		externals: [
			{
				debug: "''"
			},
			'source-map-support',
			'font-awesome'
		]
	})
}