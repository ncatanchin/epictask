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
		return (['C','/','.'].includes(dir.charAt(0))) ?
			path.resolve(dir) :
			path.join(baseDir, dir)
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
		aliasMap[name] = path.resolve(process.cwd(),'packages',name)
		return aliasMap
	},{})
}


function makeAliases() {
	return _.assign(makePackageAliases(),{
		buildResources: path.resolve(baseDir, 'build'),
		libs: path.resolve(baseDir, 'libs'),
		
		styles: tsAlias('epic-assets/styles'),
		assets: tsAlias('epic-assets')
		
	})
}

/**
 * Create externals array
 */
function makeExternals() {
	return [
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

function makeHotEntry(entry) {
	// HMR ENTRY ADDITION
	if (isDev) {
		entry.unshift('webpack/hot/poll.js?500')
	}
	
	return entry
}


function makeOutputConfig(name,isEntry = false) {
	const
		outputConfig = {
			path: `${distDir}/`,
				publicPath: "./",
			libraryTarget: 'commonjs2'
		}
	
	//if (name) {
		outputConfig.filename = '[name].js'
	//}

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
		'#cheap-module-inline-source-map' :
		"source-map"

// Webpack Config
function makeConfig(pkg) {
	// const
	// 	name = "epic"
	// const
	// 	{
	// 		name,
	// 		entry: isEntry
	// 	} = pkg,
	// 	//dependencies = unwrapDependencies(pkg.dependencies)
	// 	dependencies = pkg.dependencies
	//
	// log.info(`Deps for "${name}":`,dependencies)
	//
	const
		entry = {
			"epic-entry-database-server": makeHotEntry([
				"./epic-entry-database-server/index"
			]),
			"epic-entry-job-server": makeHotEntry([
				"./epic-entry-job-server/index"
			]),
			"epic-entry-main": makeHotEntry([
				"./epic-entry-main/MainEntry"
			]),
			"epic-entry-ui": makeHotEntry([
				"./epic-entry-ui/index"
			]),
		}
	
	
	let
		config = {
		
			name: "epic-entries",
			dependencies: ["epic_libs"],
			/**
			 * Target type
			 */
			target: 'electron',
			
			/**
			 * All entries including common
			 */
			//entry: makeEntry(pkg),
			entry,
			/**
			 * Source root, './packages'
			 */
			// context: path.resolve(srcRootDir,name),
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
			//recordsPath: `${distDir}/records__${name}`,
			recordsPath: `${distDir}/records__epictask`,
			/**
			 * DevTool config
			 */
			devtool,
			
			// Currently we need to add '.ts' to the resolve.extensions array.
			resolve: makeResolveConfig(),
						
			
			// PLUGINS
			plugins: [
				new webpack.DllReferencePlugin({
					manifest: path.resolve(distDir,`manifest.epic_libs.json`)
				}),
				// IF LIB THEN ADD DLL PLUGIN
				// ...(isEntry ? [] : [
				// 	new webpack.DllPlugin({
				// 		name: `${name}_[hash]`,
				// 		path: path.resolve(distDir,`manifest.${name}.json`)
				// 	})
				// ]),
				//
				// // ADD REFS TO DEPS
				// ...dependencies.map(depName => new webpack.DllReferencePlugin({
				// 	manifest: path.resolve(distDir,`manifest.${depName}.json`)
				// })),
				
				// new webpack.optimize.CommonsChunkPlugin({
				// 	// The order of this array matters
				// 	filename: "epic-common.js",
				// 	names: ["common"],
				// 	minChunks: Infinity
				// }),
				
				//new webpack.optimize.DedupePlugin(),
				
				// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
				new ForkCheckerPlugin(),
				
				// BASICS
				//new webpack.IgnorePlugin(/vertx/),
				
				new webpack.NoErrorsPlugin(),
				
				new DefinePlugin(DefinedEnv),
				
				//new webpack.NamedModulesPlugin(),
				new webpack.ProvidePlugin({
					'Promise': 'bluebird'
				}),
				
			
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
	
	
	// if (pkg.webpackConfig)
	// 	config = pkg.webpackConfig(config,isDev)
	//
	return patchConfig(config)
	
}

const
	glob = require('glob'),
	globOpts = {
		cwd:srcRootDir,
		nodir:true
	},
	epicLibsConfig = patchConfig({
	
		name: "epic_libs",
		dependencies: [],
		target: 'electron',
		entry: {
			"epic_libs": [
				...glob.sync("epic-global/**/*",globOpts),
				...glob.sync("epic-net/**/*",globOpts),
				...glob.sync("epic-github/**/*",globOpts),
				...glob.sync("epic-database-client/**/*",globOpts),
				...glob.sync("epic-process-manager/**/*",globOpts),
				...glob.sync("epic-typedux/**/*",globOpts),
				...glob.sync("epic-services/**/*",globOpts),
				...glob.sync("epic-entry-shared/**/*",globOpts)
			]
		},
		
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
		output: makeOutputConfig("epic_libs"),
		
		// LOADERS
		module:  makeModuleConfig(),
		
		cache: true,
		//recordsPath: `${distDir}/records__${name}`,
		recordsPath: `${distDir}/records__epic_libs`,
		/**
		 * DevTool config
		 */
		devtool,
		
		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: makeResolveConfig(),
		
		
		// PLUGINS
		plugins: [
			
			// IF LIB THEN ADD DLL PLUGIN
			// ...(isEntry ? [] : [
			new webpack.DllPlugin({
				name: `epic_libs`,
				path: path.resolve(distDir,`manifest.epic_libs.json`)
			}),
			
			//new webpack.optimize.DedupePlugin(),
			
			// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
			new ForkCheckerPlugin(),
			
			// BASICS
			//new webpack.IgnorePlugin(/vertx/),
			
			new webpack.NoErrorsPlugin(),
			
			new DefinePlugin(DefinedEnv),
			
			//new webpack.NamedModulesPlugin(),
			new webpack.ProvidePlugin({
				'Promise': 'bluebird'
			}),
		
		
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
	})





module.exports = [
	epicLibsConfig,
	makeConfig(),
	// BROWSER ENTRY
	patchConfig({
		name: "epic-html",
		dependencies: [],
		target: 'electron',
		entry: {
			"epic-entry-browser": makeHotEntry([
				"./epic-entry-browser/index"
			]),
		},
		context: srcRootDir,
		stats: WebpackStatsConfig,
		output: makeOutputConfig(true),
		
		// LOADERS
		module:  makeModuleConfig(),
		
		cache: true,
		//recordsPath: `${distDir}/records__${name}`,
		recordsPath: `${distDir}/records__epictask-browser`,
		/**
		 * DevTool config
		 */
		//devtool: '#source-map',
		//devtool: '#cheap-module-source-map',
		devtool,
		
		// Currently we need to add '.ts' to the resolve.extensions array.
		resolve: makeResolveConfig(),
		
		
		// PLUGINS
		plugins: [
			// FORK CHECKER IF TYPESCRIPT / OTHERWISE - IGNORE TS(X) FILES
			new ForkCheckerPlugin(),
			
			// BASICS
			new webpack.NoErrorsPlugin(),
			new DefinePlugin(DefinedEnv),
			
			//new webpack.NamedModulesPlugin(),
			new webpack.ProvidePlugin({
				'Promise': 'bluebird'
			}),
			
			new HtmlWebpackPlugin({
				filename: "app-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/AppEntry.jade`,
				inject: false,
				isDev
			}),
			
			new HtmlWebpackPlugin({
				filename: "splash-entry.html",
				template: `${process.cwd()}/packages/epic-assets/templates/SplashEntry.jade`,
				inject: false,
				isDev
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
	})
]
// module.exports = Object
// 	.values(getPackages())
// 	.map(makeConfig)
// 	.concat()
//


