require('babel-register')


// you can use this file to add your custom webpack plugins, loaders and anything you like.
// This is just the basic way to add additional webpack configurations.
// For more information refer the docs: https://goo.gl/qPbSyX

// IMPORTANT
// When you add this file, we won't add the default configurations which is similar
// to "React Create App". This only has babel loader to load JavaScript.

module.exports = function (storybookBaseConfig, configType) {
	
	const
		_ = require('lodash'),
		path = require('path'),
		epicConfig = require('../etc/webpack/webpack.config')
	
	//return _.merge({},webpackConfig,storybookBaseConfig)
	
	const
		resolveConfig = (storybookBaseConfig.resolve = storybookBaseConfig.resolve || {}),
		moduleConfig = (storybookBaseConfig.module = storybookBaseConfig.module || {}),
		pluginConfig = (storybookBaseConfig.plugins = storybookBaseConfig.plugins || {})
	
	// ALIAS
	Object.assign(resolveConfig.alias = resolveConfig.alias || {}, epicConfig.resolve.alias)
	
	// EXTENSIONS
	resolveConfig.extensions = resolveConfig.extensions || []
	resolveConfig.extensions.splice(0,0,...epicConfig.resolve.extensions)
	resolveConfig.extensions = _.uniq(resolveConfig.extensions)
	
	// ROOTS
	console.log('Existing root',resolveConfig.root)
	resolveConfig.modules = resolveConfig.moduleDirectories =
		(resolveConfig.modules || resolveConfig.moduleDirectories || []).concat(epicConfig.resolve.modules)
	resolveConfig.root = [...resolveConfig.modules]
	
	// LOADERS
	moduleConfig.loaders.push(...epicConfig.module.loaders)
	//moduleConfig.preLoaders = (moduleConfig.preLoaders || []).concat(epicConfig.module.preLoaders)
	//module
	
	const
		isDev = true,
		webpack = require('../node_modules/@kadira/storybook/node_modules/webpack')
	
	
	pluginConfig.push(
		new webpack.DefinePlugin({
			__DEV__: isDev,
			DEBUG: isDev,
			'Env.isDev': isDev,
			'process.env.__DEV__': isDev,
			'process.env.NODE_ENV': JSON.stringify(env),
			'process.env.BASEDIR': path.resolve(__dirname, '..'),
			'process.env.GITHUB_API_TOKEN': process.env.GITHUB_API_TOKEN && JSON.stringify(process.env.GITHUB_API_TOKEN),
			'ProcessConfig.isStorybook()': true,
			
			'process.env.DefaultTransportScheme': JSON.stringify('IPC'),
			'Env.isElectron': false
		}),
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			chunks: ['preview']
		})
		
		//new webpack.HotModuleReplacementPlugin()
	)
	
	
	storybookBaseConfig.entry.vendor = [
		'react',
		'react-dom',
		'radium',
		'autoprefixer',
		'material-ui',
		'redux',
		'redux-logger',
		'redux-thunk',
		'react-redux',
		'react-markdown',
		'reactotron-redux',
		'bluebird',
		'babel-polyfill',
		'core-js',
		'highlight.js',
		'react-split-pane',
		'reselect',
		'lodash',
		'immutable',
		'react-tap-event-plugin',
		'short-id',
		'tinycolor2'
	]
	
	
	_.merge(storybookBaseConfig, _.pick(epicConfig,['sassLoader']), {
		//devtool: 'eval',
		devtool: '#cheap-module-inline-source-map',
		//devtool: 'inline-source-map',
		output: {
			devtoolModuleFilenameTemplate: "http://localhost:6006/[absolute-resource-path]"
			//devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			//devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
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
			
		},
		devServer: {
			inline: true,
			hot: true
		}
	})
	
	return storybookBaseConfig
	
};
