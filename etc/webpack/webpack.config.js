try {
	require('babel-core/register')
} catch (err) {}
try {
	require('babel-polyfill')
} catch (err) {}

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
	ForkCheckerPlugin = require('awesome-typescript-loader').ForkCheckerPlugin
	

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
			['C','/','.'].includes(dir.charAt(0)) ?
				path.resolve(dir) :
				path.join(baseDir, dir)
		
		//log.info(chalk.green(`Resolved "${dir}":`) + `${resolvedPath}`)
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
	
	
	// EXTERNALS / makes all node_modules external
	nodeExternals = require('webpack-node-externals')
	
	

//log.info(chalk.green.bold.underline(`Using module directories: ${moduleDirs.join(', ')}`))

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
		"LoaderEntry": [`./LoaderEntry`],
		"BrowserEntry": [`./BrowserEntry`],
	}
	

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
	
	entry: entries,
	context: srcRootDir,
	stats: WebpackStatsConfig,
	output: {
		path: `${distDir}/`,
		//publicPath: isDev ? './dist/app/' : './', //`${path.relative(process.cwd(),distDir)}/`,
		publicPath: "./",
		filename: '[name].bundle.js',
		libraryTarget: 'commonjs2'
	},
	
	
	
	cache: true,
	recordsPath: `${distDir}/_records`,
	//devtool: '#source-map',
	devtool: '#cheap-module-source-map',
	
	// Currently we need to add '.ts' to the resolve.extensions array.
	resolve: {
		
		// ALIAS
		alias: {
			styles: path.resolve(baseDir, 'src/assets/styles'),
			assets: path.resolve(baseDir, 'src/assets'),
			libs: path.resolve(baseDir, 'libs'),
			buildResources: path.resolve(baseDir, 'build'),
			GitHubClient: tsAlias('shared/GitHubClient'),
			Constants: tsAlias('shared/Constants'),
			Settings: tsAlias('shared/settings/Settings')
		},
		
		
		// MODULE PATHS
		modules: moduleDirs,
		
		// FALLBACK PATHS
		//fallback: [path.resolve(baseDir,'src')],
		
		// EXTENSIONS
		extensions: ['.ts','.tsx','.js', '.jsx']
		
	},
	
	// LOADERS
	module:  loaders,
	
	// PLUGINS
	plugins: [
		//new webpack.dependencies.LabeledModulesPlugin(),
		
		// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
		//new ForkCheckerPlugin(),
		
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
			inject: false,
			isDev
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
		//devtool: '#cheap-module-source-map',
		// devtool: '#inline-source-map',
		//devtool: '#cheap-module-inline-source-map',
		//devtool: 'eval',
		devtool: 'cheap-module-eval-source-map',
		
		// In development specify absolute path - better debugger support
		output:  {
			devtoolModuleFilenameTemplate: "[absolute-resource-path]",
			devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
		},
		
		//debug: true,
		//dev: true
	})
	
	// Add HMR
	config.plugins.splice(1, 0, new HotModuleReplacementPlugin())
} else {
	config.plugins.push(new webpack.optimize.UglifyJsPlugin({
		mangle: false,
		mangleProperties: false,
		compress:{
			warnings: true
		}
	}),new webpack.LoaderOptionsPlugin({
		minimize: true,
		debug: false
	}))
}


module.exports = config
	


