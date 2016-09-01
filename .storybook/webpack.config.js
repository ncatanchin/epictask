require('babel-register')
// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://goo.gl/qPbSyX

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

module.exports = function (storybookBaseConfig, configType) {
	
	const
		// Generates externals config
		nodeExternals = require('webpack-node-externals'),
		
		ATS = require('awesome-typescript-loader'),
		{TsConfigPathsPlugin, ForkCheckerPlugin} = ATS,
		_ = require('lodash'),
		path = require('path'),
		projects = require('../etc/projects'),
		rendererProject = projects['electron-renderer-ui'],
		epicConfig = rendererProject.webpackConfigFn(rendererProject)
	
	//return _.merge({},webpackConfig,storybookBaseConfig)
	
	const
		resolveConfig = (storybookBaseConfig.resolve = storybookBaseConfig.resolve || {}),
		moduleConfig = (storybookBaseConfig.module = storybookBaseConfig.module || {}),
		pluginConfig = (storybookBaseConfig.plugins = storybookBaseConfig.plugins || {}),
		tsConfigFile = `${process.cwd()}/.tsconfig.renderer.ui.json`
	
	console.log(`Using tsconfig file @ ${tsConfigFile}`)
	
	// Resolve config - Alias & Extensions are easy
	Object.assign(resolveConfig.alias = resolveConfig.alias || {}, epicConfig.resolve.alias)
	resolveConfig.extensions = resolveConfig.extensions || []
	resolveConfig.extensions.push(...epicConfig.resolve.extensions)// = _.uniq(epicConfig.resolve.extensions.concat(resolveConfig.extensions))
	
	console.log('Existing root',resolveConfig.root)
	resolveConfig.modules = resolveConfig.moduleDirectories =
		(resolveConfig.modules || resolveConfig.moduleDirectories || []).concat(epicConfig.resolve.modules)
	resolveConfig.root = [...resolveConfig.modules]
	
	// Add all module dirs - but resolve first to filter for unique
	
	// resolveConfig.modules = _.uniq(resolveConfig.modules.map(dir => path.resolve(dir)))
	// Now loaders
	//moduleConfig.loaders.push(...epicConfig.module.loaders)
	moduleConfig.preLoaders = (moduleConfig.preLoaders || []).concat(epicConfig.module.preLoaders)
	//module
	
	moduleConfig.loaders.push(...[
		{
			test: /\.json$/,
			loader: 'json'
		},
		// TYPESCRIPT
		{
			test: /\.ts$/,
			exclude: [/libs\/.*\/typings/,/typelogger/,/typedux/,/typestore/],
			loaders: [`awesome-typescript-loader?tsconfig=${tsConfigFile}`]
		},
		
		// TSX
		{
			test: /\.tsx$/,
			exclude: [/libs\/.*\/typings/,/typelogger/,/typedux/,/typestore/],
			loaders: [`awesome-typescript-loader?tsconfig=${tsConfigFile}`],
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
	])
	
	const
		isDev = true,
		webpack = require('../node_modules/@kadira/storybook/node_modules/webpack')
	
	pluginConfig.push(
		new ForkCheckerPlugin(),
		new webpack.DefinePlugin({
			__DEV__: isDev,
			DEBUG: isDev,
			'Env.isDev': isDev,
			'process.env.__DEV__': isDev,
			'process.env.NODE_ENV': JSON.stringify(env),
			'process.env.BASEDIR': path.resolve(__dirname, '..'),
			'process.env.PROCESS_TYPE': 'renderer',
			'ProcessConfig.isStorybook()': true,
			'process.env.DefaultTransportScheme': JSON.stringify('IPC')
		})
	)
	
	
	_.merge(storybookBaseConfig, _.pick(epicConfig,['sassLoader']), {
		devtool:'eval',
		output: {
			devtoolModuleFilenameTemplate: "file://[absolute-resource-path]"
		},
		externals: [
			//externals,
			function(context,request,cb) {
				if (/(level|electron|mkdirp|node-fetch|form-data|utf8-encoding|winston|colors(\.js|\/))/.test(request))
					return cb(null,'commonjs ' + request)
				
				cb()
			},
			{
				electron: true
			}
		],
		node: {
			__filename: true,
			__dirname: true,
			process: true,
			global: true,
			Buffer: true,
			console: true,
			fs: 'empty',
			dgram: 'empty',
			net: 'empty',
			tls: 'empty'
			
		}
	})
	//storybookBaseConfig.target = 'electron-renderer'
	return storybookBaseConfig
	//
	// return {
	// 	plugins: [
	// 		// your custom plugins
	// 	],
	// 	module: {
	// 		loaders: [
	// 			// add your custom loaders.
	// 		],
	// 	}
	// }
};
