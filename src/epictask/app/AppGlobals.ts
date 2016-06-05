
// Retrieve the getTheme method from the theme manager
import "./ThemeManager"
import ReactGlobal = require('react')
import * as ReactDOMGlobal from 'react-dom'

declare global {
	var CSSModules:any
	var React:typeof ReactGlobal
	var ReactDOM:typeof ReactDOMGlobal
}

/**
 * Configure the local logger
 */
const TypeLogger = require('typelogger')
const remote = require('electron').remote
const RemoteLoggerFactory = remote.getGlobal('LoggerFactory')


/**
 * Local log factory that creates both local and remote loggers
 *
 * @param name
 * @returns {ILoggerFactory}
 */
function LoggerFactory(name) {

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
	CSSModules: require('react-css-modules'),
	React: ReactGlobal,
	ReactDOM: ReactDOMGlobal,
	getLogger(name) {
		return LoggerFactory(name)
	}
})

export {

}