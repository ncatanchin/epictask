
require('../tools/global-env')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const
	webpack = require('webpack'),
	FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin'),
	NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin'),
	fs = require('fs'),
	baseConfig = require('./webpack.config')


module.exports = function(projectConfig) {

	projectConfig = projectConfig || projectConfigs['electron-main']

	const config = baseConfig(projectConfig)

	// HMR
	const hmrEntry = [
		'webpack/hot/poll.js?1000' /// 'webpack/hot/only-dev-server',
		//const hmrEntry = 'webpack/hot/signal.js'
	]


	let mainEntries = ["./src/main/MainEntry"]
	if (isDev)
		mainEntries.unshift(...hmrEntry)

	const mainEntry = {
		"MainEntry": mainEntries
	}

	if (isDev)
		Object.assign(mainEntry,{
			"MainTestEntry": ['./src/tests/main/MainTestEntry']
		})

	//console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	Object.assign(config, {

		entry: mainEntry,

		target: 'electron',
		//target: 'node',
		debug: true,
		devtool: 'inline-source-map',
		//devtool: '#cheap-module-eval-source-map',
		//devtool: '@#source-map',
		watch: isDev,
		//hot:isDev,

		plugins: [
			...config.plugins,
			new webpack.DefinePlugin({
				'process.env.PROCESS_TYPE': JSON.stringify('main')
			}),
			new HtmlWebpackPlugin({
				filename: "main-db-entry.html",
				template: 'src/main/db/DatabaseServerEntry.jade',
				inject: false
			}),
			new HtmlWebpackPlugin({
				filename: "main-entry.html",
				template: 'src/main/MainEntry.jade',
				inject: false
			}),
			// new HtmlWebpackPlugin({
			// 	filename: "main-devtools-entry.html",
			// 	template: 'src/main/MainDevToolsWindow.jade',
			// 	inject: false
			// })
		],

		node: {
			__dirname: true,
			__filename: true,
			global:true,
			process: true
		}
	})

	config.output.devtoolFallbackModuleFilenameTemplate =
		config.output.devtoolModuleFilenameTemplate = "[absolute-resource-path]"

	//console.error("MAIN CONFIG",config)

	return config
}
