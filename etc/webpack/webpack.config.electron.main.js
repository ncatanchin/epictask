import baseConfigFn from './webpack.config'
const HtmlWebpackPlugin = require('html-webpack-plugin')

const
	webpack = require('webpack'),
	FunctionModulePlugin = require('webpack/lib/FunctionModulePlugin'),
	NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin'),
	fs = require('fs')


export default function (projectConfig = projectConfigs['electron-main']) {
	
	const config = baseConfigFn(projectConfig)
	
	// HMR
	const hmrEntry = [
		'webpack/hot/signal.js'
		//'webpack/hot/poll.js?1000' /// 'webpack/hot/only-dev-server',
		//const hmrEntry = 'webpack/hot/signal.js'
	]
	
	
	// Base entries
	const mainEntries = {
		"MainEntry": ["./src/main/MainEntry"],
		"JobsEntry": ["./src/jobs/JobsEntry"]
	}
	
	// In development env add hmr to all base entries
	if (isDev) {
		Object
			.values(mainEntries)
			.forEach(files => files.unshift(...hmrEntry))
		
		Object.assign(mainEntries, {
			"MainTestEntry": ['./src/tests/MainTestEntry'],
			"JobsTestEntry": ['./src/tests/JobsTestEntry']
		})
	}
	
	//console.log('isDev',isDev,'env',process.env.NODE_ENV,env)
	return {
		...config,
		
		entry: mainEntries,
		output: {
			...config.output,
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
		},
		target: 'electron',
		debug: true,
		devtool: isDev ? 'inline-source-map' : 'source-map',
		watch: isDev,
		
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
			})
		],
		
		node: {
			__dirname: true,
			__filename: true,
			global: true,
			process: true
		}
	}
	
}