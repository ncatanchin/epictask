import 'shared/ProcessConfig'

/**
 * Configure the local logger
 */
const TypeLogger = require('typelogger')
const remote = !ProcessConfig.isStorybook() && require('electron').remote
const RemoteLoggerFactory = !ProcessConfig.isStorybook() && remote.getGlobal('getLogger')


/**
 * Local log factory that creates both local and remote loggers
 *
 * @param name
 */
function RendererLoggerFactory(name) {

	const remoteLogger = RemoteLoggerFactory && RemoteLoggerFactory(name)
	const localLogger = TypeLogger.create(name)

	return ['debug','warn','info','error','trace'].reduce((newLogger,nextLevel) => {
		newLogger[nextLevel] = function(...args) {
			localLogger[nextLevel](...args)
			if (remoteLogger && ['warn','error'].includes(nextLevel))
				remoteLogger[nextLevel](...args)
		}

		return newLogger
	},{})
}

Object.assign(global,{
	getLogger(name) {
		return RendererLoggerFactory(name)
	}
})

export {
}
