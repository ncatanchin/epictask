const assert = require('assert')
const fs = require('fs')
const path = require('path')

//const baseDir = path.resolve(__dirname,'../../..')
// const sassContentLoader = path.resolve(baseDir,'src/epictask/tools/sass-constants-preloader')
// const themesJs = path.resolve(baseDir,'src/epictask/app/themes/Palettes.js')


export default function (projectConfig) {


	const loaders = {
		
		/**
		 * All preloaders, for
		 * hot loading, source-maps, etc
		 */
		preLoaders: [{
				test: /\.(tsx?|jsx?)$/,
				exclude: /node_modules/,
				loaders: ['source-map-loader']
		}],
		
		/**
		 * Baseline for all loaders
		 */
		loaders: [{
			test: /\.json$/,
			loader: 'json'
		}]
	}

	// If we got a project config then add normal loaders
	if (projectConfig) {
		
		const tsconfigFile = projectConfig.tsconfig
		assert(fs.existsSync(tsconfigFile), `tsconfig must exists: ${tsconfigFile}`)

		// Create all required loaders
		const newLoaders = [

			// TYPESCRIPT
			{
				test: /\.ts$/,
				exclude: /libs\/.*\/typings/,
				loaders: [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
			},

			// TSX
			{
				test: /\.tsx$/,
				exclude: /libs\/.*\/typings/,
				loaders: (() => {
					const loaders = [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
					if (isDev && projectConfig.targetType === TargetType.ElectronRenderer)
						loaders.splice(0, 0, 'react-hot-loader/webpack')

					return loaders
				})(),
			},


			// BABEL/JS
			{
				happy: {id: 'js'},
				test: /\.jsx?$/,
				//exclude: /node_modules/,
				exclude: /(node_modules|material-ui)/,
				loaders: ['babel']
			},


			// JADE
			{
				happy: {id: 'jade'},
				test: /\.(jade|pug)$/,
				loaders: ['jade-loader']
			},

			// ASSETS
			{
				type: 'fonts',
				test: /\.(eot|svg|ttf|woff|woff2)\w*/,
				loader: 'file?name=assets/fonts/[name].[hash].[ext]'

			},
			{
				test: /\.(png|jpg|gif|ico)$/,
				loader: 'file?name=assets/images/[name].[hash].[ext]',
				type: 'images'
			},


			// CSS
			{
				happy: {id: 'css-global'},
				test: /\.global\.css$/,
				loaders: [
					'style-loader',
					'css-loader?sourceMap'
				]
			},
			{
				happy: {id: 'css-node-modules'},
				test: /node_modules.*\.css$/,
				loaders: ['file?name=assets/images/[name].[hash].[ext]']
			},
			{
				happy: {id: 'css'},
				test: /^((?!\.global).)*\.css$/,
				exclude: /(node_modules)/,
				loaders: [
					'style-loader',
					'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
				]
			},

			// SCSS
			{
				happy: {id: 'scss-global'},
				test: /\.global\.scss$/,
				loaders: [
					'style-loader',
					'css-loader',
					'sass'
				]
			},
			{
				happy: {id: 'scss'},
				test: /^((?!\.global).)*\.scss$/,
				exclude: /(node_modules)/,
				loaders: [
					'style-loader',
					'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
					// 'css-loader',
					// 'postcss-loader?parser=postcss-js',
					'sass'
					// ,
					// sassContentLoader + '?path=' + themesJs
				]
			}
		]
		
		loaders.loaders.push(...newLoaders)

	}


	return loaders
}
