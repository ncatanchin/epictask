const path = require('path')
const baseDir = path.resolve(__dirname,'..')

const configs = {
	"electron.main": {
		target: 'electron-main',
		tsconfig: `${baseDir}/etc/tsconfig.main.json`
	},
	"electron.renderer": {
		target: 'electron-renderer',
		tsconfig: `${baseDir}/etc/tsconfig.renderer.json`
	}
}



Object.keys(configs).forEach(configName => {
	const config = configs[configName]
	config.webpackConfig = require(`./webpack/webpack.config.${configName}`)(config)
	config.webpackConfig.name = configName
})



module.exports = configs