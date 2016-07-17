/**
 * Configure the local logger
 */
const TypeLogger = require('typelogger')
const remote = require('electron').remote
const RemoteLoggerFactory = remote.getGlobal('getLogger')


/**
 * Local log factory that creates both local and remote loggers
 *
 * @param name
 * @returns {ILoggerFactory}
 */
function RendererLoggerFactory(name) {

	const remoteLogger = RemoteLoggerFactory(name)
	const localLogger = TypeLogger.create(name)

	return ['debug','warn','info','error','trace'].reduce((newLogger,nextLevel) => {
		newLogger[nextLevel] = function(...args) {
			localLogger[nextLevel](...args)
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
