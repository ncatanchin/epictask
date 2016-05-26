
require('../tools/global-env')

//const HtmlWebpackPlugin = require('html-webpack-plugin')
const
	webpack = require('webpack'),
	//nodeExternals = require('webpack-node-externals'),
	FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin'),
	NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin'),
	//ExternalsPlugin = webpack.ExternalsPlugin,
	fs = require('fs'),
	baseConfig = require('./webpack.config')

const nodeModules = fs.readdirSync('node_modules')
	.filter((x) => ['.bin'].indexOf(x) === -1)

module.exports = function() {
	const
		config = baseConfig(),
		{DLL} = config

	
	//console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	Object.assign(config, {

		entry: {
			[DLL.Name]: DLL.Libs
		},

		output: Object.assign(config.output,{
			//libraryTarget: "commonjs",
			library: DLL.OutputName

		}),

		target: 'web',
		devtool: 'source-map',

		externals: {
			electron: 'commonjs electron'
		},


		plugins: [
			DLL.DllPlugin,
			...config.plugins,
			new NodeTargetPlugin()
		],

		node: {
			__dirname: true,
			__filename: true
		}
	})


	console.log(config)

	return config
}