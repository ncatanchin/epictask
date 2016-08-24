import {startElectron} from './tools/electron-dev-spawn'
import {makeTsConfigBase,makeTsConfig} from './tools/ts-config'


const {Deferred,TargetType,RunMode,log,isDev,env} = global
const path = require('path')
const baseDir = path.resolve(__dirname,'..')
const getPort = require('get-port')
const rendererReady = new Deferred()
const gutil = require('gulp-util')

makeTsConfigBase()

const projectElectronMain = {
	targetType: TargetType.ElectronMain,
	tsconfig: makeTsConfig(
		`${baseDir}/.tsconfig.main.json`,
		'main',
		require('./awesome-typescript-loader-options')({
			instanceName:'electron-main'
		})
	),
	onCompileCallback(err,stats,watchMode = false) {
		log.info('Compile callback main!!!',err,isDev,watchMode)
		if (err) {
			log.error(`electron main failed to compile, can not start`)
			return
		}

		if (!watchMode && !isDev) {
			log.info('we only autostart electron in dev or watch modes')
		}

		//rendererReady.promise.then(startElectron)
	}
}



const rendererDefaultConfig = (name) => ({
	targetType: TargetType.ElectronRenderer,
	tsconfig: makeTsConfig(
		`${baseDir}/.tsconfig.renderer.${name}.json`,
		'browser',
		require('./awesome-typescript-loader-options')({
			instanceName:`electron-${name}-renderer`,
			cacheDirectory: `.awcache.renderer.${name}`
		}),
		{
			"compilerOptions": {
				"jsx": "react"
			},
		}
	),
	onCompileCallback(err,stats) {
		if (err)
			return

		log.info(`Renderer ${name} ready`)
		rendererReady.resolve(true)
	}

})

/**
 * UI Renderer
 */
const projectElectronUIRenderer = _.assign(rendererDefaultConfig('ui'),{
	port: 4444
})


function makeConfigs() {

	let configs = {

		/**
		 * Configuring electron.main project/package
		 */
		"electron-main": projectElectronMain,


		/**
		 * Configuring electron renderer
		 */
		"electron-renderer-ui": projectElectronUIRenderer

	}


	/**
	 * Iterator projects completing configuration
	 */
	Object.keys(configs).forEach((projectName) => {
		console.log('Project name ' + projectName)

		const projectConfig = configs[projectName]
		projectConfig.name = projectName

		// Get target information
		const {targetType} = projectConfig
		const targetEnv = targetType.env[env]
		gutil.log('env','target type',targetType,targetEnv)


		projectConfig.webpackConfig = Object.assign({},{
			projectName,
			name: projectName,
			target: targetType.target
		})


		Object.assign(projectConfig,{
			runMode: targetEnv.runMode,
			webpackConfigFn() {
				// Get webpackconfig
				const normalizedName = projectName.replace(/-/g,'.')
				const webpackConfigFilename = path.resolve(__dirname,`webpack/webpack.config.${normalizedName}`)
				//console.log(`Prepared project: ${webpackConfigFilename}`,targetEnv,targetType)

				return require(webpackConfigFilename).default(projectConfig)
			}
		})
	})

	return configs
}

const configs = makeConfigs()



module.exports = configs
