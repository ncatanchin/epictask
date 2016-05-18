
//const HtmlWebpackPlugin = require('html-webpack-plugin')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
//const JsonpTemplatePlugin = webpack.JsonpTemplatePlugin
const FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin')
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin')
const ExternalsPlugin = webpack.ExternalsPlugin


module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	const hmrEntry = 'webpack/hot/poll.js' //'webpack/hot/signal.js'
	console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	return Object.assign(config, {

		entry: {
			"MainEntry": (isDev ? [hmrEntry,'webpack/hot/server'] : []).concat([
				"./src/main/MainEntry"
			])
		},

		target: 'electron-renderer',

		devtool: 'source-map',

		output: Object.assign(config.output,{
			libraryTarget:'commonjs2'
		}),

		externals: {
			electron: "require('electron')"
		},

		plugins: [
			...config.plugins,
			new ExternalsPlugin('commonjs',nodeExternals()),
			new NodeTargetPlugin(),
			new webpack.HotModuleReplacementPlugin()

		],
		node: {
			__dirname: true,
			__filename: true
		}
	})
}