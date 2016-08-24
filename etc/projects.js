import {makeTsConfigBase,makeTsConfig} from './tools/ts-config'
import makeAwesomeOptions from './awesome-typescript-loader-options'

const
	{
		Deferred,
		TargetType,
		env
	} = global,
	path = require('path'),
	baseDir = path.resolve(__dirname,'..')


// Create the base TSConfig
makeTsConfigBase()


//region MAIN PROJECT
const projectElectronMain = {
	
	name: 'electron-main',
	
	// Target
	targetType: TargetType.ElectronMain,
	
	// TypeScript Config file
	tsconfig: makeTsConfig(
		
		// Output to base path
		`${baseDir}/.tsconfig.main.json`,
		
		// Awesome typescript loader options
		makeAwesomeOptions({
			instanceName:'electron-main'
		})
	),
	
	// Compile callback
	onCompileCallback(err,stats,watchMode = false) {
		
	}
}
//endregion


//region RENDERER PROJECT
/**
 * Electron Renderer Project Config
 */
const projectElectronRenderer = {
	
	name: 'electron-renderer-ui',
	
	// Target
	targetType: TargetType.ElectronRenderer,
	
	// TypeScript Config
	tsconfig: makeTsConfig(
		`${baseDir}/.tsconfig.renderer.json`,
		
		makeAwesomeOptions({
			instanceName:`electron-renderer`,
			cacheDirectory: `.awcache.renderer`
		}),
		{
			"compilerOptions": {
				"jsx": "react"
			},
		}
	),
	onCompileCallback(err,stats) {
	},
	
	// Dev Server Port
	port: 4444
}
//endregion



function makeConfigs() {

	return Object.entries({
		"electron-main": projectElectronMain,
		"electron-renderer-ui": projectElectronRenderer
	}).reduce((configs, [name,config]) =>
		Object.assign(configs, {
			[name]: {
				...config,
				name,
				target: config.targetType.target,
				runMode: config.targetType.env[env].runMode,
				
				// Webpack Config Builder
				webpackConfigFn: (config) =>
					require(
						path.resolve(__dirname, `webpack/webpack.config.${name.replace(/-/g, '.')}`)
					).default(config)
				
			}
		})
	,{})
	//
	//
	// /**
	//  * Iterator projects completing configuration
	//  */
	// Object.keys(configs).forEach((projectName) => {
	//
	//
	// 	const projectConfig = configs[projectName]
	// 	projectConfig.name = projectName
	//
	// 	// Get target information
	// 	const {targetType} = projectConfig
	// 	const targetEnv = targetType.env[env]
	// 	gutil.log('env','target type',targetType,targetEnv)
	//
	//
	// 	projectConfig.webpackConfig = Object.assign({},{
	// 		projectName,
	// 		name: projectName,
	// 		target: targetType.target
	// 	})
	//
	//
	// 	Object.assign(projectConfig,{
	// 		runMode: targetEnv.runMode,
	//
	// 	})
	// })
	//
	// return configs
}


exports = makeConfigs()
