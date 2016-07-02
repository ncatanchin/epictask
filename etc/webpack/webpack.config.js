require('../tools/global-env')


const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const webpack = require('webpack')
const assert = require('assert')
const path = require('path')
const nodeExternals = require('webpack-node-externals')

const
	baseDir = path.resolve(__dirname,'../..'),
	distDir = `${baseDir}/dist`

const {DefinePlugin,ExternalsPlugin,HotModuleReplacementPlugin} = webpack

// Import globals - just for linting
const {isDev,env} = global

const libAlias = (name,libPath) => ({
	[name]: path.resolve(baseDir,`libs/${libPath}`)
})

const resolveDirs = (...dirs) => dirs.map(dir => path.resolve(baseDir,dir))

module.exports = function (projectConfig) {
	const config = {

		context: baseDir,

		stats: WebpackStatsConfig,
		output: {
			path: `${distDir}/`,
			publicPath: `dist/`,
			filename: '[name].js',
			libraryTarget: 'commonjs2'
		},

		recordsPath: `${distDir}/_records`,

		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: {

			alias: _.assign({
				assert: 'browser-assert',
				epictask: path.resolve(baseDir,'src/epictask'),
				styles: path.resolve(baseDir,'src/epictask/assets/styles'),
				assets: path.resolve(baseDir,'src/epictask/assets'),
				components: path.resolve(baseDir,'src/epictask/ui/components'),
				ui: path.resolve(baseDir,'src/epictask/ui'),
				shared: path.resolve(baseDir,'src/epictask/shared'),
				//simplemde: path.resolve(baseDir,'node_modules/simplemde/src/js/simplemde.js'),
				main: path.resolve(baseDir,'src/epictask/main'),
				// "typedux": path.resolve(baseDir,"../typedux/src/index.ts"),
				// "typemutant": path.resolve(baseDir,"../typemutant/src/index.ts"),
				// "typelogger": path.resolve(baseDir,"../typelogger/src/index.ts"),
				// "typestore": path.resolve(baseDir,"../typestore/packages/typestore/src/index.ts"),
				// "typestore-mocks": path.resolve(baseDir,"../typestore/packages/typestore-plugin-mocks/src/index.ts"),
				// "typestore-plugin-indexeddb": path.resolve(baseDir,"../typestore/packages/typestore-plugin-indexeddb/src/index.ts"),
				// "typestore-plugin-pouchdb": path.resolve(baseDir,"../typestore/packages/typestore-plugin-pouchdb/src/index.ts")
			},
				libAlias('typedux','typedux/src/index.ts'),
				libAlias('typemutant','typemutant/src/index.ts'),
				libAlias('typelogger','typelogger/src/index.ts'),
				libAlias('typestore','typestore/packages/typestore/src/index.ts'),
				libAlias('typestore-mocks','typestore/packages/typestore-mocks/src/index.ts'),
				libAlias('typestore-plugin-pouchdb','typestore/packages/typestore-plugin-pouchdb/src/index.ts'),

			),
			modules: resolveDirs(
				'src',
				'libs/typedux/src',
				'libs/typemutant/src',
				'libs/typelogger/src',
				'libs/typestore/packages/typestore/src',
				'libs/typestore/packages/typestore-mocks/src',
				'libs/typestore/packages/typestore-plugin-pouchdb/src',
				'libs',
				'node_modules'
			),

			extensions: ['', '.ts', '.tsx', '.webpack.js', '.web.js', '.js'],
			packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']

		},

		// Add the loader for .ts files.
		module: Object.assign({},require('./parts/loaders')(projectConfig),{
			//noParse: [/simplemde\.min/]
		}),

		// SASS/SCSS Loader Config
		sassLoader: {
			includePaths: [path.resolve(baseDir, "./src/epictask/assets")]
		},

		plugins: [
			new webpack.IgnorePlugin(/vertx/),
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.NoErrorsPlugin(),
			new ForkCheckerPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				DEBUG: isDev,
				'process.env.__DEV__': isDev,
				'process.env.NODE_ENV': JSON.stringify(env),
				'process.env.BASEDIR': path.resolve(__dirname,'../..')
			}),
			new webpack.ProvidePlugin({
				//simplemde: 'simplemde/src/js/simplemde.js'
				// 'Promise': 'bluebird'
			})
		],
		node: {
			__dirname: true,
			__filename: true
		},

		externals:[
			nodeExternals({
				whitelist: [
					/webpack\/hot/,
					/webpack-hot/,
					/urlsearchparams/,
					/typestore\//,
					/typestore-plugin-pouchdb/,
					/typestore-mocks/,
					/typelogger/,
					/typemutant/,
					/typedux/
				]
			})
		]

	}

	// Development specific updates
	Object.assign(config,{

		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',

		// In development specify absolute path - better
		// debugger support
		output: Object.assign({},config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]"
		} : {}),




		debug: isDev,
		dev: isDev
	})

	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1,0,new HotModuleReplacementPlugin())


	return config

}

