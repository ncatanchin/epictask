import Electron from 'epic-electron'




let
	windowManagerClientProvider:() => IWindowManagerClient,
	windowManagerClientProxy

/**
 * If on the main process, return the real thing
 *  - otherwise RPC ref from Electron.remote
 *
 * @returns {WindowManager}
 */
export function getWindowManagerClient():IWindowManagerClient {
	if (windowManagerClientProvider)
		return windowManagerClientProvider()
	
	if (Env.isMain) {
		windowManagerClientProvider = () => require('epic-process-manager/WindowManager').getWindowManager()
	} else {
		windowManagerClientProxy = new Proxy({},{
			get: function(target,prop,receiver) {
				if (prop === 'open')
					prop = "openAndReturn"
				
				const
					windowManager = Electron.remote.getGlobal('getWindowManager')()
				
				return windowManager[prop]
			}
		})
		windowManagerClientProvider = () => windowManagerClientProxy
	}
	
	return windowManagerClientProvider()
}