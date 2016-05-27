
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
	let mainEntries = ["./src/main/MainEntry"]
	if (isDev)
		mainEntries.unshift(...hmrEntry)

	//console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	Object.assign(config, {

		entry: {
			"MainEntry": mainEntries
		},

		output: Object.assign(config.output,{
			libraryTarget: "commonjs2"
		}),

		target: 'electron-main',
		devtool: 'source-map',
		watch: isDev,
		hot:isDev,
		// externals: {
		// 	electron: 'commonjs electron',
		// 	formidable: 'commonjs formidable',
		// 	debug: "commonjs debug",
		// 	superagent: "commonjs superagent",
		// 	//assert: "commonjs assert",
		// 	'electron-is-dev': 'commonjs electron-is-dev'
		// },

		externals:
		{
			debug: "commonjs debug",
			electron: 'commonjs electron',
			'source-map-support': 'commonjs source-map-support',
			'font-awesome': 'commonjs font-awesome',
			formidable: 'commonjs formidable',
			superagent: 'commonjs superagent',
			'any-promise': 'commonjs any-promise',
			'electron-is-dev': 'commonjs formidable',
			dns: 'commonjs dns',
			request: 'commonjs request',
			http: 'commonjs http',
		},


		plugins: [
			...config.plugins,
			new ExternalsPlugin(nodeExternals()),
			new NodeTargetPlugin()
		],

		node: {
			__dirname: true,
			__filename: true
		}
	})


	//console.log(config)

	return config
}