const webpack = require('webpack')
const assert = require('assert')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)
	
	return Object.assign(config, {

		entry: {
			"AppEntry": ["./src/app/AppEntry"]
		},

		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist`
		} : {}),

		

		// Mark a couple of simple externals
		externals: [
			{
				debug: "''"
			},
			'source-map-support',
			'font-awesome'
		]
	})
}