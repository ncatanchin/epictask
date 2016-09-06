const
	assert = require('assert'),
	fs = require('fs'),
	path = require('path')

//const baseDir = path.resolve(__dirname,'../../..')
// const sassContentLoader = path.resolve(baseDir,'src/epictask/tools/sass-constants-preloader')
// const themesJs = path.resolve(baseDir,'src/epictask/app/themes/Palettes.js')


export default function (projectConfig) {

	// Resolve the absolute path to the proxy provided loader
	const proxyProvidedLoaderPath =
		path.resolve(process.cwd(),'src/tools/provided-proxy-loader.js')

	const loaders = {
		
		/**
		 * All preloaders, for
		 * hot loading, source-maps, etc
		 */
		preLoaders: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				loaders: [proxyProvidedLoaderPath,'source-map-loader']
			},{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loaders: ['source-map-loader']
			}
		],
		
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

			// TypeScript
			{
				test: /\.tsx?$/,
				exclude: [/typelogger/,/typedux/,/typestore/],
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
				exclude: /(node_modules|material-ui|typestore|typedux|typelogger)/,
				loaders: ['babel']
			},


			// JADE
			{
				happy: {id: 'jade'},
				test: /\.(jade|pug)$/,
				loaders: ['jade-loader']
			},

			// ASSETS / FONTS
			{
				type: 'fonts',
				test: /\.(eot|svg|ttf|woff|woff2)\w*/,
				loader: 'file?name=assets/fonts/[name].[hash].[ext]'

			},
			
			// ASSETS / IMAGES & ICONS
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
