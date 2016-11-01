
import { RemoteDebuggingPort } from "epic-global"
import {app} from 'electron'

/**
 * In debug mode enable remote debugging
 */
if (Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}

export {
	
}