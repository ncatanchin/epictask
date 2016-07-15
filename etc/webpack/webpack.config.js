require('../tools/global-env')


const ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
const webpack = require('webpack')
const assert = require('assert')
const path = require('path')
const fs = require('fs')
const nodeExternals = require('webpack-node-externals')

const
	baseDir = path.resolve(__dirname, '../..'),
	distDir = `${baseDir}/dist`

const {DefinePlugin, ExternalsPlugin, HotModuleReplacementPlugin} = webpack

// Import globals - just for linting
const {isDev, env} = global

const libAlias = (name, libPath) => ({
	[name]: path.resolve(baseDir, `libs/${libPath}`)
})

const resolveDirs = (...dirs) => dirs.map(dir => path.resolve(baseDir, dir))
const useMaterialUIBuild = (fs.existsSync(process.cwd(),'node_modules/material-ui-build'))
const materialUiModule = useMaterialUIBuild ?
	      'material-ui-build/src' : 'material-ui'
console.log(`Using material ui version ${materialUiModule}`)
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

			alias: _.assign(
				{
					assert: 'browser-assert',

					// Map material-ui to build ver if available
					"material-ui": materialUiModule,

					epictask: path.resolve(baseDir, 'src'),
					styles: path.resolve(baseDir, 'src/assets/styles'),
					assets: path.resolve(baseDir, 'src/assets'),
					components: path.resolve(baseDir, 'src/ui/components'),
					ui: path.resolve(baseDir, 'src/ui'),
					shared: path.resolve(baseDir, 'src/shared'),
					actions: path.resolve(baseDir, 'src/shared/actions'),
					GitHubClient: path.resolve(baseDir, 'src/shared/GitHubClient'),
					Constants: path.resolve(baseDir, 'src/shared/Constants'),
					Settings: path.resolve(baseDir, 'src/shared/Settings'),
					models: path.resolve(baseDir, 'src/shared/models'),
					main: path.resolve(baseDir, 'src/main'),

				},
				libAlias('typedux', 'typedux/src/index.ts'),
				libAlias('typemutant', 'typemutant/src/index.ts'),
				libAlias('typelogger', 'typelogger/src/index.ts'),
				libAlias('typestore', 'typestore/packages/typestore/src/index.ts'),
				libAlias('typestore-mocks', 'typestore/packages/typestore-mocks/src/index.ts'),
				libAlias('typestore-plugin-pouchdb', 'typestore/packages/typestore-plugin-pouchdb/src/index.ts'),
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
		module: Object.assign({}, require('./parts/loaders')(projectConfig), {
			//noParse: [/simplemde\.min/]
		}),

		// SASS/SCSS Loader Config
		sassLoader: {
			includePaths: [path.resolve(baseDir, "./src/assets")]
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
				'process.env.BASEDIR': path.resolve(__dirname, '../..')
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

		externals: [
			nodeExternals({
				whitelist: [
					/material-ui/,
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

	if (useMaterialUIBuild)
		config.resolve.modules.push(path.resolve(processDir,'node_modules/material-ui-build/node_modules'))

	//config.resolve.modules.push(path.resolve(processDir,'node_modules/react-hotkeys/node_modules'))

	// Development specific updates
	Object.assign(config, {

		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',

		// In development specify absolute path - better
		// debugger support
		output: Object.assign({}, config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]"
		} : {}),


		debug: isDev,
		dev: isDev
	})

	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1, 0, new HotModuleReplacementPlugin())


	return config

}

