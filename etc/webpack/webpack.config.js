require('../tools/global-env')



const
	{
		isDev,
		env,
		baseDir,
		srcRootDir,
		chalk,
		TypeScriptEnabled
	} = global,
	webpack = require('webpack'),
	assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	HtmlWebpackPlugin = require('html-webpack-plugin'),
	ForkCheckerPlugin = (TypeScriptEnabled) ? require('awesome-typescript-loader').ForkCheckerPlugin : null
	

// Import globals



/**
 * Resolves directories and maps to ram disk
 * if available
 *
 * @param dirs
 */
function resolveDirs(...dirs) {
	return dirs.map(dir => {
		const resolvedPath =
			['/','.'].includes(dir.charAt(0)) ?
				path.resolve(dir) :
				path.join(baseDir, dir)
		
		log.info(chalk.green(`Resolved "${dir}":`) + `${resolvedPath}`)
		return resolvedPath
	})
}



assert(fs.existsSync(srcRootDir),`TypeScript must be compiled to ${path.resolve(srcRootDir)}`)

const
	
	// Module Directories
	moduleDirs = resolveDirs(srcRootDir,'node_modules'),
	
	// Output Directory
	distDir = `${baseDir}/dist/app`,
	
	// Env
	DefinedEnv = {
		__DEV__: isDev,
		DEBUG: isDev,
		'Env.isDev': isDev,
		'process.env.__DEV__': isDev,
		'process.env.NODE_ENV': JSON.stringify(env),
		'process.env.BASEDIR': baseDir,
		'process.env.DefaultTransportScheme': JSON.stringify('IPC'),
		'ProcessConfig.isStorybook()': false,
		'Env.isElectron': true
	},
	
	// Import non-typed plugins
	{
		DefinePlugin,
		HotModuleReplacementPlugin
	} = webpack,
	
	
	
	// Enable flag for using happy pack
	happyEnabled = false,
	
	// EXTERNALS / makes all node_modules external
	nodeExternals = require('webpack-node-externals')
	
	

log.info(chalk.green.bold.underline(`Using module directories: ${moduleDirs.join(', ')}`))

// TypeScript SRC ALIAS
function tsAlias(tsFilename) {
	return path.resolve(srcRootDir, tsFilename)
}



const
	
	
	// Create loaders
	loaders = require('./parts/loaders'),
	
	// Entries
	entries = {
		"AppEntry": [`./AppEntry`],
		"LoaderEntry": [`./LoaderEntry`]
	},
	
	// Import HappyPack
	HappyPack = require('happypack'),
	
	// HAPPY THREAD POOL
	happyThreadPool = happyEnabled && HappyPack.ThreadPool({size: 10}),
	
	// HAPPY LOAD PLUGINS
	happyPlugins = (!happyEnabled || isMain) ? [] :
		loaders.loaders
			.filter(loader => loader.happy && loader.happy.id)
			.map(loader => new HappyPack({
				id: `${loader.happy.id}`,
				threadPool: happyThreadPool
			}))

// HMR ENTRY ADDITION
if (isDev) {
	entries.AppEntry.unshift('webpack/hot/poll.js?500')
	//.forEach(entry => entry.unshift('webpack/hot/signal'))
	//`webpack/hot/poll.js?1000`
}

// Webpack Config
const config = {
	
	// Target
	target: 'electron',
	//watch: isDev,
	// Compile callback
	onCompileCallback(err,stats,watchMode = false) {
		if (err)
			log(`Compile Failed`, err)
	},
	
	entry: entries,
	context: srcRootDir,
	stats: WebpackStatsConfig,
	output: {
		path: `${distDir}/`,
		//publicPath: `${path.relative(process.cwd(),distDir)}/`,
		publicPath: "./",
		filename: '[name].bundle.js',
		libraryTarget: 'commonjs2'
	},
	
	
	
	cache: true,
	recordsPath: `${distDir}/_records`,
	devtool: '#source-map',
	debug: true,
	
	// Currently we need to add '.ts' to the resolve.extensions array.
	resolve: {
		
		// ALIAS
		alias: {
			styles: path.resolve(baseDir, 'src/assets/styles'),
			assets: path.resolve(baseDir, 'src/assets'),
			libs: path.resolve(baseDir, 'libs'),
			GitHubClient: tsAlias('shared/GitHubClient'),
			Constants: tsAlias('shared/Constants'),
			Settings: tsAlias('shared/settings/Settings')
		},
		
		
		// MODULE PATHS
		modules: moduleDirs,
		
		// FALLBACK PATHS
		fallback: [path.resolve(baseDir,'src')],
		
		// EXTENSIONS
		extensions: TypeScriptEnabled ? ['', '.ts','.tsx','.js', '.jsx'] : ['', '.js', '.jsx'],
		
		// PACKAGE MAIN
		packageMains: ['webpack', 'browser', 'web', ['jam', 'main'], 'main']
		
	},
	
	// LOADERS
	module:  loaders,
	
	// SASS/SCSS Loader Config
	sassLoader: {
		includePaths: [path.resolve(baseDir, "./src/assets")]
	},
	
	// POSTCSS (NOT USED CURRENTLY)
	postcss() {
		return [
			require('postcss-modules'),
			require('autoprefixer'),
			require('postcss-js')
		]
	},
	
	// HAPPY PACK
	other: {
		happyPlugins
	},
	
	// PLUGINS
	plugins: [
		// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
		...(ForkCheckerPlugin ?
			[new ForkCheckerPlugin()] :
			[new webpack.WatchIgnorePlugin([/src\/.*\.tsx?$/])]),
		
		// HAPPY PACK PLUGINS
		...happyPlugins,
		
		
		// SPLIT FOR PARALLEL LOADING
		// new webpack.optimize.AggressiveSplittingPlugin({
		// 	maxSize: 50000
		// }),
		
		// BASICS
		new webpack.IgnorePlugin(/vertx/),
		//new webpack.optimize.OccurrenceOrderPlugin(),
		new webpack.NoErrorsPlugin(),
		new HtmlWebpackPlugin({
			filename: "app-entry.html",
			template: `${baseDir}/src/assets/templates/AppEntry.jade`,
			inject: false
		}),
		new DefinePlugin(DefinedEnv),
		new webpack.NamedModulesPlugin(),
		new webpack.ProvidePlugin({
			'Promise': 'bluebird'
		})
	],
	
	// NODE SHIMS
	node: {
		__dirname: true,
		__filename: true,
		global: true,
		process: true
	},
	
	// Configure all node_modules as external if in electron
	externals: [
		nodeExternals({
			whitelist: [
				/webpack\/hot/,
				/webpack-hot/
			]
		}),
		{
			electron: true
		}
	]
}
	
// Development specific updates
if (isDev) {
	_.merge(config, {
		
		//In development, use inline source maps
		//devtool: '#source-map',
		devtool: '#inline-source-map',
		//devtool: '#cheap-module-inline-source-map',
		
		// In development specify absolute path - better debugger support
		output:  {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
		},
		
		//debug: true,
		dev: true
	})
	
	// Add HMR
	config.plugins.splice(1, 0, new HotModuleReplacementPlugin())
}


module.exports = config
	


