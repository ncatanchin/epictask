
//const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
//const JsonpTemplatePlugin = webpack.JsonpTemplatePlugin
const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const ExternalsPlugin = webpack.ExternalsPlugin


module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)
	
	return Object.assign(config, {

		entry: {
			"MainEntry": ["./src/main/MainEntry"]
		},

		devtool: 'source-map',
		// output: Object.assign(config.output,{
		// 	libraryTarget:'commonjs2'
		// }),

		externals: {
			electron: "require('electron')",
		},

		plugins: [
			new ExternalsPlugin('commonjs',nodeExternals()),
			new NodeTargetPlugin(),
			...config.plugins
		],
		node: {
			__dirname: true,
			__filename: true
		}
	})
}