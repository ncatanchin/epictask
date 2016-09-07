import baseConfigFn from './webpack.config'

const webpack = require('webpack')
const assert = require('assert')

export default function (projectConfig) {
	const config = baseConfigFn(projectConfig)

	const entries = {
		"UIEntry": [`${srcRootDir}/ui/UIEntry`]
	}

	return {
		...config,
		entry: entries,
		output: Object.assign(config.output, isDev ? {
			publicPath: `http://localhost:${projectConfig.port}/dist/app/`
		} : {}),
		plugins: [
			...config.plugins,
			new webpack.DefinePlugin({
				'Env.isMain': true
			})
		],

		target: 'electron-renderer'
	}
}
