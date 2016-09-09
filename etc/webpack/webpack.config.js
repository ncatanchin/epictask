require('../tools/global-env')



const
	webpack = require('webpack'),
	assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	HtmlWebpackPlugin = require('html-webpack-plugin')

// Import globals
const {
	isDev,
	env,
	baseDir,
	srcRootDir,
	chalk
} = global


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
	
	// Import HappyPack
	HappyPack = require('happypack'),
	
	// Enable flag for using happy pack
	happyEnabled = false,
	
	// Generates externals config
	nodeExternals = require('webpack-node-externals')
	
	

log.info(chalk.green.bold.underline(`Using module directories: ${moduleDirs.join(', ')}`))

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
	return path.resolve(srcRootDir, tsFilename)
}



const
	happyThreadPool = happyEnabled && HappyPack.ThreadPool({size: 10}),
	
	// Create loaders
	loaders = require('./parts/loaders'),
	
	// Entries
	entries = {
		"AppEntry": [`./AppEntry`],
		"LoaderEntry": [`./LoaderEntry`]
	},
	
	// Add HappyPack plugins if enabled
	happyPlugins = (!happyEnabled || isMain) ? [] :
		loaders.loaders
			.filter(loader => loader.happy && loader.happy.id)
			.map(loader => new HappyPack({
				id: `${loader.happy.id}`,
				threadPool: happyThreadPool
			}))

// In dev add signal hot processor
if (isDev) {
	entries.AppEntry.unshift('webpack/hot/poll.js?500')
	// Object
	// 	.values(entries)
	// 	.forEach(entry => entry.unshift('webpack/hot/poll.js?500'))
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
	devtool: 'source-map',

	// Currently we need to add '.ts' to the resolve.extensions array.
	resolve: {
		
		alias: _.assign(
			{
				styles: path.resolve(baseDir, 'src/assets/styles'),
				assets: path.resolve(baseDir, 'src/assets'),
				libs: path.resolve(baseDir, 'libs'),
				GitHubClient: tsAlias('shared/GitHubClient'),
				Constants: tsAlias('shared/Constants'),
				Settings: tsAlias('shared/Settings')
				
			}
		),
		
		
		
		modules: moduleDirs,
		fallback: [path.resolve(baseDir,'src')],
		
		extensions: ['', '.js', '.jsx'],
		
		packageMains: ['webpack', 'browser', 'web', ['jam', 'main'], 'main']
		
	},
	
	// Add the loader for .ts files.
	module:  loaders,
	
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
		new HtmlWebpackPlugin({
			filename: "main-entry.html",
			template: `${baseDir}/src/main/MainEntry.jade`,
			inject: false
		}),
		new DefinePlugin(DefinedEnv),
		new webpack.NamedModulesPlugin(),
		new webpack.ProvidePlugin({
			'Promise': 'bluebird'
		})
	
	]),
	
	// Shim node mods
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
		devtool: 'inline-source-map',
		//devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
		
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
	


