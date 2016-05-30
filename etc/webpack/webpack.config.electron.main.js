
require('../tools/global-env')

//const HtmlWebpackPlugin = require('html-webpack-plugin')
const
	webpack = require('webpack'),
	nodeExternals = require('webpack-node-externals'),
	//JsonpTemplatePlugin = webpack.JsonpTemplatePlugin
	HotModuleReplacementPlugin = webpack.HotModuleReplacementPlugin,
	FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin'),
	NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin'),
	ExternalsPlugin = webpack.ExternalsPlugin,
	fs = require('fs'),
	baseConfig = require('./webpack.config')

const nodeModules = fs.readdirSync('node_modules')
	.filter((x) => ['.bin'].indexOf(x) === -1)

module.exports = function(projectConfig) {
	projectConfig = projectConfig || projectConfigs['electron-main']
	const config = baseConfig(projectConfig)

	const hmrEntry = [
		//'webpack/hot/only-dev-server',
		'webpack/hot/poll.js?1000'
	]
	//const hmrEntry = 'webpack/hot/signal.js'
	let mainEntries = ["./src/epictask/main/MainEntry"]
	if (isDev)
		mainEntries.unshift(...hmrEntry)

	//console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	Object.assign(config, {

		entry: {
			"MainEntry": mainEntries
		},

		target: 'electron-main',
		devtool: 'source-map',
		watch: isDev,
		hot:isDev,

		plugins: [
			...config.plugins,
			new webpack.DefinePlugin({
				'process.env.PROCESS_TYPE': JSON.stringify('main')
			})
		],

		node: {
			__dirname: true,
			__filename: true
		}
	})


	//console.log(config)

	return config
}