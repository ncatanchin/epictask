require('../tools/global-env')

import loadersConfigFn from './parts/loaders'

const ATS = require('awesome-typescript-loader')
const {TsConfigPathsPlugin, ForkCheckerPlugin} = ATS

const webpack = require('webpack')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

//const WebpackBuildNotifierPlugin = require('webpack-build-notifier')


const
	baseDir = path.resolve(__dirname, '../..'),
	distDir = `${baseDir}/dist`,
	
	// Import non-typed plugins
	{
		DefinePlugin,
		ExternalsPlugin,
		HotModuleReplacementPlugin
	} = webpack,
	
	// Import HappyPack
	HappyPack = require('happypack'),
	
	// Enable flag for using happy pack
	happyEnabled = true,
	
	// Generates externals config
	nodeExternals = require('webpack-node-externals'),
	
	// Import globals
	{
		isDev,
		env
	} = global


/**
 * Create an alias to the libs folder
 *
 * @param name
 * @param libPath
 * @returns {{}}
 */
function libAlias(name, libPath) {
	return {
		[name]: path.resolve(baseDir, `libs/${libPath}`)
	}
}

/**
 * Resolves directories and maps to ram disk
 * if available
 *
 * @param dirs
 */
const resolveDirs = (...dirs) => dirs.map(dir => {
	const ramDiskResolvePath = path.join(RamDiskPath, dir)
	const resolvedPath = fs.realpathSync(
		fs.existsSync(ramDiskResolvePath) ?
			ramDiskResolvePath :
			path.resolve(baseDir, dir)
	)
	
	log.info(`Resolved "${dir}" = "${resolvedPath}"`)
	return resolvedPath
})

/**
 * Use npm|build version of material-ui
 *
 * @type {boolean}
 */


export default function (projectConfig) {
	
	const
		happyThreadPool = happyEnabled && HappyPack.ThreadPool({size: 5}),
		
		// Renderer or Main
		isMain = projectConfig.targetType === TargetType.ElectronMain,
		
		// Create loaders
		loaders = loadersConfigFn(projectConfig),
		happyPlugins = (!happyEnabled || isMain) ? [] :
			loaders.loaders
				.filter(loader => loader.happy && loader.happy.id)
				.map(loader => new HappyPack({
					id: `${loader.happy.id}`,
					tempDir: `.happypack-${projectConfig.name}`,
					threadPool: happyThreadPool
				}))
	
	
	const config = {
		
		context: baseDir,
		
		stats: WebpackStatsConfig,
		output: {
			path: `${distDir}/`,
			publicPath: `dist/`,
			filename: '[name].js',
			libraryTarget: 'commonjs2'
		},
		cache: true,
		
		recordsPath: `${distDir}/_records`,
		
		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: {
			
			alias: _.assign(
				{
					assert: 'browser-assert',
					
					// Map material-ui to build ver if available
					
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
					main: path.resolve(baseDir, 'src/main')
				}
			),
			
			
			// root: 'src',
			
			modules: resolveDirs(
				'src',
				'node_modules'
			),
			
			extensions: ['', '.ts', '.tsx', '.js', '.jsx'],
			packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']
			
		},
		
		// Add the loader for .ts files.
		module: Object.assign({}, loaders, {
			//noParse: [/simplemde\.min/]
		}),
		
		// SASS/SCSS Loader Config
		sassLoader: {
			includePaths: [path.resolve(baseDir, "./src/assets")]
		},
		
		postcss() {
			return [
				require('postcss-modules'),
				require('autoprefixer'),
				require('postcss-js')
			]
		},
		
		other: {happyPlugins},
		
		plugins: happyPlugins.concat([
			//new TsConfigPathsPlugin(),
			new webpack.IgnorePlugin(/vertx/),
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.NoErrorsPlugin(),
			new ForkCheckerPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				DEBUG: isDev,
				'Env.isDev': isDev,
				'process.env.__DEV__': isDev,
				'process.env.NODE_ENV': JSON.stringify(env),
				'process.env.BASEDIR': path.resolve(__dirname, '../..'),
				'process.env.PROCESS_NAME': projectConfig.name,
				'process.env.PROCESS_TYPE': JSON.stringify(isMain ? 'main' : 'renderer'),
				'process.env.DefaultTransportScheme': JSON.stringify('IPC')
			}),
			new webpack.ProvidePlugin({
				//simplemde: 'simplemde/src/js/simplemde.js'
				// 'Promise': 'bluebird'
			}),
		
		]),
		node: {
			__dirname: true,
			__filename: true
		},
		
		externals: [
			nodeExternals({
				whitelist: [
					// /material-ui/,
					/webpack\/hot/,
					/webpack-hot/,
					/urlsearchparams/,
					// /typestore\//,
					// /typestore-plugin-pouchdb/,
					// /typestore-mocks/
				]
			}),
			{
				electron: true
			}
		]
		
	}
	
	// if (useMaterialUIBuild)
	// 	config.resolve.modules.push(path.resolve(processDir,'node_modules/material-ui-build/node_modules'))
	
	//config.resolve.modules.push(path.resolve(processDir,'node_modules/react-hotkeys/node_modules'))
	
	// Development specific updates
	Object.assign(config, {
		
		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',
		//
		//devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
		
		// In development specify absolute path - better
		// debugger support
		output: Object.assign({}, config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
			
		} : {}),
		
		
		debug: isDev,
		dev: isDev
	})
	
	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1, 0, new HotModuleReplacementPlugin())
	
	
	return config
	
}

