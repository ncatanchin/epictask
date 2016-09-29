const
	assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	proxyProvidedLoaderPath = require.resolve('../loaders/provided-proxy-loader'),
	{TypeScriptEnabled} = global,
	srcTest = TypeScriptEnabled ? /\.tsx?$/ :  /\.jsx?$/

log.info(`Resolved provided proxy pre-loader to ${proxyProvidedLoaderPath}`)

module.exports = {
	/**
	 * All pre-loaders, for
	 * hot loading, source-maps, etc
	 */
	// preLoaders: [
	// 	{
	// 		//happy: {id: 'js-pre'},
	// 		test: srcTest,
	// 		exclude: [/node_modules/],
	// 		loaders: ['source-map-loader',proxyProvidedLoaderPath]
	// 	}
	// ],
	
	
	loaders: [
		{
			//happy: {id: 'json'},
			test: /\.json$/,
			loader: 'json'
		},
		
		// SourceCode
		{
			//happy: {id: 'source'},
			test: srcTest,
			exclude: [/(node_modules|typedux|typelogger|typestore)/],
			loaders: [TypeScriptEnabled ? 'awesome-typescript' : 'babel','source-map-loader',proxyProvidedLoaderPath],
			
			// Add the query object for babel
			// ...(TypeScriptEnabled ? {} : {
			// 	query:  {
			// 		cacheDirectory: true
			// 	}
			// })
		},
		
		// JADE
		{
			//happy: {id: 'jade'},
			test: /\.(jade|pug)$/,
			loaders: ['pug-loader']
		},
		
		// ASSETS / FONTS
		{
			//happy: {id: 'fonts'},
			//type: 'fonts',
			test: /\.(eot|svg|ttf|woff|woff2)\w*/,
			loaders: ['file?name=assets/fonts/[name].[hash].[ext]']
			
		},
		
		// ASSETS / IMAGES & ICONS
		{
			//happy: {id: 'images'},
			test: /\.(png|jpg|gif|ico)$/,
			loaders: ['file?name=assets/images/[name].[hash].[ext]'],
			//type: 'images'
		},
		
		
		// CSS
		{
			//happy: {id: 'css-global'},
			test: /\.global\.css$/,
			loaders: [
				'style-loader',
				'css-loader?sourceMap'
			]
		},
		{
			//happy: {id: 'css-node-modules'},
			test: /node_modules.*\.css$/,
			loaders: ['file?name=assets/images/[name].[hash].[ext]']
		},
		{
			//happy: {id: 'css'},
			test: /^((?!\.global).)*\.css$/,
			exclude: /(node_modules)/,
			loaders: [
				'style-loader',
				'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]'
			]
		},
		
		// SCSS
		{
			//happy: {id: 'scss-global'},
			test: /\.global\.scss$/,
			loaders: [
				'style-loader',
				'css-loader',
				`sass?includePaths=${path.resolve(baseDir, "./src/assets")}`
			],
			// query: {
			// 	includePaths: [path.resolve(baseDir, "./src/assets")]
			// }
		},
		{
			//happy: {id: 'scss'},
			test: /^((?!\.global).)*\.scss$/,
			exclude: /(node_modules)/,
			loaders: [
				'style-loader',
				'css-loader?modules&sourceMap&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
				// 'css-loader',
				// 'postcss-loader?parser=postcss-js',
				`sass?includePaths=${path.resolve(baseDir, "./src/assets")}`
				// ,
				// sassContentLoader + '?path=' + themesJs
			],
			// query: {
			// 	includePaths: [path.resolve(baseDir, "./src/assets")]
			// }
		}
	]
}


