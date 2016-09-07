require('../tools/global-env')

import loadersConfigFn from './parts/loaders'

const ATS = require('awesome-typescript-loader')
const {TsConfigPathsPlugin, ForkCheckerPlugin} = ATS

const webpack = require('webpack')
const assert = require('assert')
const path = require('path')
const fs = require('fs')

//const WebpackBuildNotifierPlugin = require('webpack-build-notifier')
const {baseDir,TypeScriptEnabled} = global
/**
 * Resolves directories and maps to ram disk
 * if available
 *
 * @param dirs
 */
const resolveDirs = (...dirs) => dirs.map(dir => {
	// const ramDiskResolvePath = path.join(RamDiskPath, dir)
	// const resolvedPath = fs.realpathSync(
	// 	fs.existsSync(ramDiskResolvePath) ?
	// 		ramDiskResolvePath :
	// 		path.resolve(baseDir, dir)
	// )
	const resolvedPath = path.join(baseDir, dir)
	log.info(`Resolved "${dir}" = "${resolvedPath}"`)
	return resolvedPath
})

const
	//baseDir = path.resolve(__dirname, '../..'),
	tsDir = (TypeScriptEnabled) ? 'src' : 'build/js',
	moduleDirs = resolveDirs(...(global.TypeScriptEnabled ?
		['src','node_modules'] :
		[tsDir,'src','node_modules'])),
	distDir = `${baseDir}/dist/app`,
	
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

log.info(`MODULE DIRS = ${moduleDirs.join(', ')}`)
//process.exit(1)
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

function tsAlias(tsFilename) {
	return path.resolve(tsDir, tsFilename)
}


/**
 * Use npm|build version of material-ui
 *
 * @type {boolean}
 */




export default function (projectConfig) {
	
	
	const
		happyThreadPool = happyEnabled && HappyPack.ThreadPool({size: 10}),
		
		// Renderer or Main
		isMain = projectConfig.targetType === TargetType.ElectronMain,
		
		// Create loaders
		loaders = loadersConfigFn(projectConfig),
		
		// Add HappyPack plugins if enabled
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
			publicPath: `${path.relative('.',distDir)}/`,
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
					
					//epictask: path.resolve(baseDir, 'src'),
					styles: path.resolve(baseDir, 'src/assets/styles'),
					assets: path.resolve(baseDir, 'src/assets'),
					// components: tsAlias('ui/components'),
					// ui: tsAlias('ui'),
					// shared: tsAlias('shared'),
					// actions: tsAlias('shared/actions'),
					GitHubClient: tsAlias('shared/GitHubClient'),
					Constants: tsAlias('shared/Constants'),
					Settings: tsAlias('shared/Settings'),
					// models: tsAlias('shared/models'),
					// main: tsAlias('main'),
					// server: tsAlias('server'),
					// tests: tsAlias('tests'),
					// job: tsAlias('job'),
					// db: tsAlias('db'),
					react: path.resolve(baseDir, 'node_modules/react')
				}
			),
			
			
			
			modules: moduleDirs,
			
			extensions: global.TypeScriptEnabled ?
				['', '.ts', '.tsx', '.js', '.jsx'] :
				['', '.js', '.jsx'],
			
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
		
		// Post CSS Config (Not Used currently)
		postcss() {
			return [
				require('postcss-modules'),
				require('autoprefixer'),
				require('postcss-js')
			]
		},
		
		// Attach any random data we need to use later
		other: {
			happyPlugins
		},
		
		// Create final list of plugins
		plugins: happyPlugins.concat([
			new webpack.IgnorePlugin(/vertx/),
			new webpack.optimize.OccurrenceOrderPlugin(),
			new webpack.NoErrorsPlugin(),
			new DefinePlugin({
				__DEV__: isDev,
				DEBUG: isDev,
				'Env.isDev': isDev,
				'process.env.__DEV__': isDev,
				'process.env.NODE_ENV': JSON.stringify(env),
				'process.env.BASEDIR': path.resolve(__dirname, '../..'),
				'process.env.PROCESS_NAME': projectConfig.name,
				'process.env.PROCESS_TYPE': JSON.stringify(isMain ? 'main' : 'renderer'),
				'process.env.DefaultTransportScheme': JSON.stringify('IPC'),
				'process.env.BLUEBIRD_LONG_STACK_TRACES': 1
			}),
			new webpack.NamedModulesPlugin(),
			new webpack.ProvidePlugin({
				'Promise': 'bluebird'
			})
		
		]),
		
		// Shim node mods
		node: {
			__dirname: true,
			__filename: true
		},
		
		// Configure all node_modules as external if in electron
		externals: [
			nodeExternals({
				whitelist: [
					// /material-ui/,
					/webpack\/hot/,
					/webpack-hot/,
					// /urlsearchparams/,
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
	
	if (TypeScriptEnabled)
		config.plugins.splice(0,0,new TsConfigPathsPlugin(),new ForkCheckerPlugin())
	
	// Development specific updates
	Object.assign(config, {
		
		//In development, use inline source maps
		devtool: isDev ? 'inline-source-map' : 'source-map',
		//devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
		
		// In development specify absolute path - better debugger support
		output: Object.assign({}, config.output, isDev ? {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
			
		} : {}),
		
		
		//debug: isDev,
		dev: isDev
	})
	
	// In DEV environments make sure HMR is enabled
	if (isDev)
		config.plugins.splice(1, 0, new HotModuleReplacementPlugin())
	
	
	return config
	
}

