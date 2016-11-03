
import { RemoteDebuggingPort } from "epic-global/Constants"
import {app} from 'electron'

/**
 * In debug mode enable remote debugging
 */
if (Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}

export {
	
}