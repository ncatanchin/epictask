const path = require('path')
const baseDir = path.resolve(__dirname,'..')
const getPort = require('get-port')
const nodemon = require('nodemon')
const child = require('child')
const rendererReady = new Deferred()

let electronChild = null

function startElectron() {
	if (!electronChild) {
		log.info('Starting electron')
		electronChild = child({
			command: `${baseDir}/node_modules/.bin/cross-env`,
			args: ['electron','--disable-http-cache','./dist/MainEntry.js'],
			options: {
				env: Object.assign({}, process.env, {
					HOT: '1',
					PATH: `${baseDir}/node_modules/.bin:${process.env.PATH}`
				})
			},
			autoRestart: false,
			cbClose(exitCode) {
				log.info(`Electron closed with ${exitCode}`)
			}
		})

		electronChild.start(() => {
			log.info(`Started Electron: ${code}`)
		})

	} else {
		electronChild.restart((code) => {
			log.info(`Restarted Electron: ${code}`)
		},9)
	}
}


function makeConfigs() {
	
	let configs = {

		/**
		 * Configuring electron.main project/package
		 */
		"electron-main": {
			targetType: TargetType.ElectronMain,
			tsconfig: `${baseDir}/etc/tsconfig.main.json`,
			onCompileCallback(err,stats,watchMode = false) {
				log.info('Compile callback main!!!',err,isDev,watchMode)
				if (err) {
					log.error(`electron main failed to compile, can not start`)
					return
				}

				if (!watchMode && !isDev) {
					log.info('we only autostart electron in dev or watch modes')
					return
				}

				//rendererReady.promise.then(startElectron)
			}
		},


		/**
		 * Configuring electron renderer
		 */
		"electron-renderer": {
			targetType: TargetType.ElectronRenderer,
			tsconfig: `${baseDir}/etc/tsconfig.renderer.json`,
			port: 4444,
			onCompileCallback(err,stats) {
				if (err)
					return
				
				log.info('Renderer ready')
				rendererReady.resolve(true)
			}
		}
	}

	Object.keys(configs).forEach(name => {
		const config = configs[name]
		config.name = name
		
		// Get target information
		const {targetType} = config
		const targetEnv = targetType.env[env]
		
		// Get webpackconfig
		config.webpackConfig = require(`./webpack/webpack.config.${name.replace(/-/g,'.')}`)(config)
		Object.assign(config.webpackConfig,{
			name,
			target: targetType.target
		})
		
		Object.assign(config,{
			runMode: targetEnv.runMode
		})
	})

	return configs
}

const configs = makeConfigs()



module.exports = configs