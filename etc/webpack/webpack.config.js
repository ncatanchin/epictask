try {
	require('babel-core/register')
} catch (err) {}
try {
	require('babel-polyfill')
} catch (err) {}

// GET SHELL JS
require('shelljs/global')

echo(`Load global environment`)
require('../tools/global-env')

const
	{
		isDev,
		env,
		baseDir,
		srcRootDir
	} = global,
	isPackaging = !_.isNil(process.env.EPIC_PACKAGE),
	CircularDependencyPlugin = require("circular-dependency-plugin"),
	webpack = require('webpack'),
	assert = require('assert'),
	path = require('path'),
	fs = require('fs'),
	CopyWebpackPlugin = require('copy-webpack-plugin'),
	HtmlWebpackPlugin = require('html-webpack-plugin'),
	{ForkCheckerPlugin,TsConfigPathsPlugin} = require('awesome-typescript-loader')
	

// Import globals



/**
 * Resolves directories and maps to ram disk
 * if available
 *
 * @param dirs
 */
function resolveDirs(...dirs) {
	return dirs.map(dir => {
		return (['c','C','/','.'].includes(dir.charAt(0))) ?
			path.resolve(dir) :
			path.join(baseDir, dir)
	})
}



assert(fs.existsSync(srcRootDir),`TypeScript must be compiled to ${path.resolve(srcRootDir)}`)

const
	noWebpack = process.env.NO_WEBPACK,
	
	// Module Directories
	moduleDirs = resolveDirs(srcRootDir,'node_modules'),
	
	// Output Directory
	distDir = `${baseDir}/dist/${isPackaging ? 'app-package' : 'app'}`,
	
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

/**
 * Get all epic packages
 */
function getPackages() {
	const
		{packages} = require('../../epic-config')
	
	Object.keys(packages).forEach(name => {
		packages[name].name = name
	})
	
	return packages
}

/**
 * Read the tsconfig.json file
 */
function getTypeScriptConfig() {
	return JSON.parse(cat('tsconfig.json'))
}

/**
 * Get Compiler Options from tsconfig.json
 */
function getTypeScriptCompilerOptions() {
	return getTypeScriptConfig().compilerOptions
}


/**
 * Create typescript package aliases from tsconfig.json
 */
function makePackageAliases() {
	
		
		
	return Object.values(getPackages()).reduce((aliasMap = {},{name}) => {
		//aliasMap[name] = path.join('.','packages',name)// path.resolve(process.cwd(),'packages',name)
		return aliasMap
	},{})
}


function makeAliases() {
	return _.assign(makePackageAliases(),{
		buildResources: path.resolve(baseDir, 'build'),
		libs: path.resolve(baseDir, 'libs'),
		"epic-electron": tsAlias('epic-global/Electron'),
		styles: tsAlias('epic-assets/styles'),
		assets: tsAlias('epic-assets'),
		'epic-config': path.resolve(baseDir,'etc','config','default-config.js')
		
	})
}

/**
 * Create externals array
 */
function makeExternals() {
	return [
		nodeExternals({
			whitelist: [
				/webpack/,
				/webpack-hot/,
				// /react/,
				// /redux/,
				// /material-ui/,
				// /lodash/,
				// /typedux/,
				// /typetransform/,
				// /typestore/,
				//
				// /react-hot-loader\/AppContainer/,
				// /react-hot-loader\/webpack/,
			
			]
		})
		// ,
		// {
		// 	electron: true
		// }
	]
}

/**
 * Resolve package index
 *
 * @param name
 * @returns {string}
 */
function resolvePkgIndex(name) {
	return path.resolve(srcRootDir,name,'index.ts')
}

/**
 * Create module config
 */
function makeModuleConfig() {
	return require('./parts/loaders')
}

/**
 * Make all entries
 */
function makeEntry(pkg) {
	const
		entry = [`./index`]
		

	// HMR ENTRY ADDITION
	if (isDev && pkg.entry === true) {
		entry.unshift('webpack/hot/poll.js?500')
	}
	
	return {
		[pkg.name]: entry
	}
}

function makeHotEntry(entry,devEntries) {
	// HMR ENTRY ADDITION
	if (isDev) {
		
			entry.unshift("webpack/hot/dev-server")
			entry.unshift('webpack/hot/poll.js?500')
		
	}
	if (devEntries)
		entry.unshift(...devEntries)
	
	return entry
}


function makeOutputConfig(name,isEntry = false) {
	const
		outputConfig = {
			path: `${distDir}/`,
				publicPath: "./",
			// libraryTarget: 'commonjs2'
		}
	
	
	outputConfig.filename = '[name].js'
	

	if (isEntry !== true)
		outputConfig.library = `${name}`

	return outputConfig
}


function makeResolveConfig() {
	return {
		
		// ALIAS
		alias: makeAliases(),
		
		// MODULE PATHS
		modules: moduleDirs,
		
		// EXTENSIONS
		extensions: ['.ts','.tsx','.js', '.jsx']
		
	}
}

/**
 * Unwrap all deps
 *
 * @param dependencies
 * @returns {*}
 */
function unwrapDependencies(dependencies) {
	
	const
		packages = getPackages()
	
	let
		depsIn = [...(dependencies || [])]
	
	while (true) {
		const
			depsOut = _.uniq(depsIn.reduce((nextDeps,dep) => {
				nextDeps.push(...(packages[dep].dependencies || []))
				return nextDeps
			},[]).concat(depsIn))
		
		if (depsIn.length === depsOut.length)
			break
		
		depsIn = depsOut
	}
	
	return depsIn
}


function patchConfig(config) {
	// Development specific updates
	if (isDev) {
		_.merge(config, {
			// In development specify absolute path - better debugger support
			output:  {
				devtoolModuleFilenameTemplate: "[absolute-resource-path]",
				devtoolFallbackModuleFilenameTemplate: "[absolute-resource-path]"
			},
			
		})
		
		// IF ENTRY & DEV THEN HMR
		//if (isEntry)
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
	
	return config
}


//In development, use inline source maps
//devtool: '#cheap-module-source-map',
// devtool: '#inline-source-map',
//devtool: '#cheap-module-inline-source-map',
//devtool: 'eval',
//devtool: 'cheap-module-eval-source-map',
const
	devtool = isDev ?
		//"source-map" :
		//'#inline-source-map' :
		'#cheap-module-eval-source-map' :
		//'#cheap-module-inline-source-map' :
		"source-map"

// Webpack Config
function makeConfig(name,dependencies,entry,configFn) {
	
	let
		config = {
		
			name,
			dependencies,
			/**
			 * Target type
			 */
			target: 'node',
			
			/**
			 * All entries including common
			 */
			entry,
			/**
			 * Source root, './packages'
			 */
			context: srcRootDir,
			
			/**
			 * Stats config
			 */
			stats: WebpackStatsConfig,
			
			/**
			 * Output configuration
			 */
			// output: makeOutputConfig(name,isEntry || false),
			output: makeOutputConfig(null,true),
			
			// LOADERS
			module:  makeModuleConfig(),
			cache: true,
			recordsPath: `${distDir}/records__${name}`,
			
			/**
			 * DevTool config
			 */
			devtool,
			
			// Currently we need to add '.ts' to the resolve.extensions array.
			resolve: makeResolveConfig(),
						
			
			// PLUGINS
			plugins: [
				
				//new webpack.optimize.DedupePlugin(),
				
				// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
				//new TsConfigPathsPlugin(),
				new ForkCheckerPlugin(),
				
				
				//new CircularDependencyPlugin(),
				
				// BASICS
				//new webpack.IgnorePlugin(/vertx/),
				
				new webpack.NoErrorsPlugin(),
				
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
			externals: makeExternals()
		}
	
	if (configFn)
		configFn(config)
	
	return patchConfig(config)
	
}

const
	glob = require('glob'),
	globOpts = {
		cwd:srcRootDir,
		nodir:true
	}
	
const
	makeHtmlConfig = () => makeConfig('epic-html',[],{
		"epic-entry-browser": makeHotEntry([
			"./epic-entry-browser/index"
		]),
	},config => {
		
		if (noWebpack) {
			config.plugins.unshift(new CopyWebpackPlugin([
				{
					from: 'epic-assets',
					to: 'assets'
				},
				{
					from: path.resolve(process.cwd(), 'bin'),
					to: 'bin'
				}
			], {
				ignore: ["**/*.psd"],
				debug: 'info'
				
			}))
		}
		
		config.plugins.push(
			
			new HtmlWebpackPlugin({
				filename: "app-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/BrowserEntry.jade`,
				inject: false,
				isDev
			}),
			
			new HtmlWebpackPlugin({
				filename: "splash-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
				inject: false,
				isDev
			})
		
		)
	})





module.exports = noWebpack ? makeHtmlConfig() :
	
	makeConfig('epic-app',[],{
		// "epic-app-all": makeHotEntry([
		// 	"./epic-entry-database-server/index",
		// 	"./epic-entry-job-server/index",
		// 	"./epic-entry-main/MainEntry",
		// 	"./epic-entry-ui/index"
		// ]),
		// "epic-entry-job-server": makeHotEntry([
		//
		// ]),
		// "epic-entry-main": makeHotEntry([
		//
		// ]),
		// "epic-entry-ui": makeHotEntry([
		//
		// ]),
		"epic-entry-database-server": makeHotEntry([
			"./epic-entry-database-server/index"
		]),
		"epic-entry-job-server": makeHotEntry([
			"./epic-entry-job-server/index"
		]),
		"epic-entry-main": makeHotEntry([
			"./epic-entry-main/MainEntry"
		]),
		"epic-entry-ui":  makeHotEntry([
			"./epic-entry-ui/index"
			
		]),
		//,["react-hot-loader/patch"]
		
		"epic-entry-browser": [
			"./epic-entry-browser/index"
		]
		
		//
		
	}, config => {
		config.plugins.unshift(
			new webpack.optimize.CommonsChunkPlugin({
				name: "epic-common-2",
				async: true
			}),
			new HtmlWebpackPlugin({
				filename: "app-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/BrowserEntry.jade`,
				inject: false,
				isDev
			}),
			
			new HtmlWebpackPlugin({
				filename: "splash-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
				inject: false,
				isDev
			})

		)
	})
	
	// BROWSER ENTRY
	//makeHtmlConfig()
	
	// makeConfig('epic_libs',[],{
	// 	"epic_libs": makeHotEntry([
	// 		"./epic-entry-shared",
	// 		"./epic-global",
	// 		"./epic-net",
	// 		"./epic-github",
	// 		"./epic-database-client",
	// 		"./epic-database-adapter",
	// 		"./epic-process-manager",
	// 		"./epic-process-manager-client",
	// 		"./epic-typedux",
	// 		"./epic-services"
	// 	])
	// }, config => {
	// 	config.plugins.unshift(new webpack.DllPlugin({
	// 		name: `epic_libs`,
	// 		path: path.resolve(distDir,`manifest.epic_libs.json`)
	// 	}))
	// }),
	//
	
	 




