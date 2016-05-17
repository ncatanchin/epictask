
const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const JsonpTemplatePlugin = webpack.JsonpTemplatePlugin
const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const ExternalsPlugin = webpack.ExternalsPlugin


const opt = 

module.exports = (projectConfig) => {
	const config = require('./webpack.config.dev')(projectConfig)
	
	return Object.assign(config, {
		target: 'electron-main',
		entry: {
			"MainEntry": ["./src/app/MainEntry"]
		},

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