
import { RemoteDebuggingPort } from "epic-global"

const
	{app} = require('electron')

// ON LINUX ADD FLAGS
if (Env.isLinux) {
	// app.commandLine.appendSwitch('enable-transparent-visuals')
	// app.commandLine.appendSwitch('disable-gpu')
}

/**
 * In debug mode enable remote debugging
 */
if (Env.isDev) {
	app.commandLine.appendSwitch('remote-debugging-port', RemoteDebuggingPort)
}


export {
	
}