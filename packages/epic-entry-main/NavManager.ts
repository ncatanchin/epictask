import Electron from 'epic-electron'

const
	log = getLogger(__filename),
	{shell,app} = Electron,
	
	ghUrlRegEx = /github\.com\/(login|api)/,
	authCallbackUrlRegEx = /\.(com|run|io|net)\/\?code=/

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)
export function start() {
	app.on('web-contents-created', (event, webContents) => {
		webContents.on('will-navigate', (event:any, url) => {
			log.debug(`App wants to navigate`, url)
			
			if (!ghUrlRegEx.test(url) && !authCallbackUrlRegEx.test(url)) {
				event.returnValue = false
				event.preventDefault()
				
				if (url.startsWith('http')) {
					shell.openExternal(url)
				}
			}
		})
	})
	
	log.info(`Bound to navigate`)
}
