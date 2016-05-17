
const webpack = require('webpack')

module.exports = (projectConfig) => {
	const config = require('./webpack.config')(projectConfig)
	
	return Object.assign(config,{
		devtool: 'inline-source-map',
		output: Object.assign({},config.output,{
			devtoolModuleFilenameTemplate: "[absolute-resource-path]"
		}),
		debug: true,
		dev: true
	})
}
