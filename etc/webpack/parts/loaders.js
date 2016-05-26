const assert = require('assert')
const fs = require('fs')



module.exports = (projectConfig) => {


	const loaders = {
		preLoaders: [
			{
				test: /\.tsx?$/,
				exclude: /(node_modules|DLLEntry)/,
				loader: 'source-map-loader'
			},
			{
				test: /\.js$/,
				exclude: /(node_modules|DLLEntry)/,
				loader: 'source-map-loader'
			}
		],
		loaders: [{
			test: /\.json$/,
			loader: 'json'
		}]
	}

	// If we got a project config then add normal loaders
	if (projectConfig) {
		const tsconfigFile = projectConfig.tsconfig
		assert(fs.existsSync(tsconfigFile), `tsconfig must exists: ${tsconfigFile}`)

		loaders.loaders = loaders.loaders.concat([

			{
				test: /\.tsx?$/,
				loaders: (() => {
					const loaders = [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
					if (isDev && projectConfig.targetType === TargetType.ElectronRenderer)
						loaders.splice(0, 0, 'react-hot-loader/webpack')

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
		])

	}


	return loaders
}
