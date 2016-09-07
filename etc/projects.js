require('./tools/global-env')

const
	{makeTsConfigBase,makeTsConfig} = require('./tools/ts-config'),
	makeAwesomeOptions = require('./awesome-typescript-loader-options').default

const
	{
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
		//`${baseDir}/tsconfig.json`,
		
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
		//`${baseDir}/tsconfig.json`,
		
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
	}).reduce((configs, [name,config]) => {
		configs[name] = {
			
				...config,
				name,
				target: config.targetType.target,
				runMode: config.targetType.env[env].runMode,
				
				// Webpack Config Builder
				webpackConfigFn: (finalConfig) =>
					require(
						path.resolve(__dirname, `webpack/webpack.config.${name.replace(/-/g, '.')}`)
					).default(finalConfig)
				
			
		}
		
		return configs
	},{})
}


module.exports = makeConfigs()
