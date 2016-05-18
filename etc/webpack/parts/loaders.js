const assert = require('assert')
const fs = require('fs')



module.exports = (projectConfig) => {

	const tsconfigFile = projectConfig.tsconfig
	assert(fs.existsSync(tsconfigFile), `tsconfig must exists: ${tsconfigFile}`)

	return {
		preLoaders: [
			{
				test: /\.(tsx?|js)$/,
				exclude: /(node_modules)/,
				loader: 'source-map-loader'
			}
		],
		loaders: [
			{
				test: /\.json$/,
				loader: 'json'
			},
			{
				test: /\.tsx?$/,
				loaders: (() => {
					const loaders = [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
					if (isDev && projectConfig.targetType === TargetType.ElectronRenderer)
						loaders.splice(0, 0, 'react-hot')

					return loaders
				})(),
			},
			{
				test: /\.(jade|pug)$/,
				loader: 'jade-loader'
			},
			{
				test: /\.global\.css$/,
				loaders: [
					'style-loader',
					'css-loader?sourceMap'
				]
			},

			{
				test: /^((?!\.global).)*\.css$/,
				loaders: [
					'style-loader',
					'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
				]
			}
		]
	}
}
