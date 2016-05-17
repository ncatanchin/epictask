require('babel-register')


module.exports = (projectConfig) => {

	const config = require('./webpack.config.dev')(projectConfig)

	return Object.assign(config,{
		libraryTarget:'commonjs2'
	})
}