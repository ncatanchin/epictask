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
				test: /\.jsx?$/,
				exclude: [/node_modules/,/src\//],
				loaders: ['source-map-loader']
			}
		],
		
		/**
		 * Baseline for all loaders
		 */
		loaders: [{
			happy: {id: 'json'},
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

			


			// BABEL/JS
			{
				happy: {id: 'js'},
				test: /\.jsx?$/,
				exclude: /(node_modules)/,
				loader: 'babel'
			},


			// JADE
			{
				happy: {id: 'jade'},
				test: /\.(jade|pug)$/,
				loaders: ['jade-loader']
			},

			// ASSETS / FONTS
			{
				//happy: {id: 'fonts'},
				type: 'fonts',
				test: /\.(eot|svg|ttf|woff|woff2)\w*/,
				loaders: ['file?name=assets/fonts/[name].[hash].[ext]']

			},
			
			// ASSETS / IMAGES & ICONS
			{
				//happy: {id: 'images'},
				test: /\.(png|jpg|gif|ico)$/,
				loaders: ['file?name=assets/images/[name].[hash].[ext]'],
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
		
		// TypeScript
		console.log(`TypeScript enabled: ${(global.TypeScriptEnabled + '').toUpperCase()}`)
		
		if (global.TypeScriptEnabled) {
			loaders.preLoaders.unshift(
				// {
				// 	test: /\.jsx?$/,
				// 	exclude: /node_modules/,
				// 	loaders: ['source-map-loader']
				// },
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					//,'source-map-loader'
					loaders: [proxyProvidedLoaderPath,'source-map-loader']
				}
			)
			
			newLoaders.unshift({
				test: /\.tsx?$/,
				exclude: /node_modules/,
				loaders: (() => {
					//const loaders = [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
					//if (isDev && projectConfig.targetType === TargetType.ElectronRenderer)
						//loaders.splice(0, 0, 'react-hot-loader/webpack')
					
					return [`awesome-typescript-loader?tsconfig=${tsconfigFile}`]
				})(),
			})
		}
		
		loaders.loaders.push(...newLoaders)

	}


	return loaders
}
