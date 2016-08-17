import baseConfigFn from './webpack.config'

const webpack = require('webpack')
const assert = require('assert')
const HtmlWebpackPlugin = require('html-webpack-plugin')


let baseConfig = null

export default (projectConfig) => (
		baseConfig = baseConfigFn(projectConfig), {
			...baseConfig,
			// Assign entries
			entry: {
				"DatabaseServerEntry": ['./src/main/db/DatabaseServerEntry.ts']
			},
			
			// Configure Output
			output: Object.assign(baseConfig.output, isDev ? {
				publicPath: `http://localhost:${projectConfig.port}/dist/`
			} : {}),
			
			// Specify target
			target: 'electron-renderer'
	}
)
