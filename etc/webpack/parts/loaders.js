const
	assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	proxyProvidedLoaderPath = require.resolve('../loaders/provided-proxy-loader')

log.info(`Resolved provided proxy pre-loader to ${proxyProvidedLoaderPath}`)

module.exports = {
	/**
	 * All preloaders, for
	 * hot loading, source-maps, etc
	 */
	preLoaders: [
		{
			happy: {id: 'js-pre'},
			test: /\.jsx?$/,
			exclude: [/node_modules/],//,/src\//],
			loaders: ['source-map-loader',proxyProvidedLoaderPath]
		}
	],
	
	
	loaders: [
		{
			happy: {id: 'json'},
			test: /\.json$/,
			loader: 'json'
		},
		
		// BABEL/JS
		{
			happy: {id: 'js'},
			test: /\.jsx?$/,
			// exclude: [/(node_modules)/,/ui\/plugins/],
			exclude: [/(node_modules|typedux|typelogger|typestore)/],
			loader: 'babel',
			query: {
				cacheDirectory: true
			}
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
}


