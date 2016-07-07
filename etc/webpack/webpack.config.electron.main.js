
require('../tools/global-env')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const
	webpack = require('webpack'),
	FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin'),
	NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin'),
	fs = require('fs'),
	baseConfig = require('./webpack.config')

// const nodeModules = fs.readdirSync('node_modules')
// 	.filter((x) => ['.bin'].indexOf(x) === -1)

module.exports = function(projectConfig) {
	projectConfig = projectConfig || projectConfigs['electron-main']
	const config = baseConfig(projectConfig)

	const hmrEntry = [
		//'webpack/hot/only-dev-server',
		'webpack/hot/poll.js?1000'
	]
	//const hmrEntry = 'webpack/hot/signal.js'
	let mainEntries = ["./src/main/MainEntry"]
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
		//hot:isDev,

		plugins: [
			...config.plugins,
			new webpack.DefinePlugin({
				'process.env.PROCESS_TYPE': JSON.stringify('main')
			}),
			new HtmlWebpackPlugin({
				filename: "main-entry.html",
				template: 'src/main/MainEntry.jade',
				inject: false
			}),
			new HtmlWebpackPlugin({
				filename: "main-devtools-entry.html",
				template: 'src/main/MainDevToolsWindow.jade',
				inject: false
			})
		],

		node: {
			__dirname: true,
			__filename: true,
			global:true,
			process: true
		}
	})


	//console.log(config)

	return config
}
