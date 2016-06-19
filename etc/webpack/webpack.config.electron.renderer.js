const webpack = require('webpack')
const assert = require('assert')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)

	return Object.assign(config, {

		entry: {
			//'reflect-metadata'
			"UIEntry": ['babel-polyfill',"./src/epictask/ui/UIEntry"]
		},

		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist/`
		} : {}),

		plugins: [
			...config.plugins,
			new webpack.DefinePlugin({
				'process.env.PROCESS_TYPE': JSON.stringify('renderer')
			})
		],

		target: 'electron-renderer'
	})
}