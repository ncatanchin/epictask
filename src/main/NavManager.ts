
const
	log = getLogger(__filename),
	{shell,app} = require('electron')


app.on('web-contents-created',(event,webContents) => {
	webContents.on('will-navigate',(event:any,url) => {
		log.info(`App wants to navigate`,url)
		if (url.startsWith('http'))
			shell.openExternal(url)
		
		event.returnValue = false
		event.preventDefault()
	})
})

log.info(`Bound to navigate`)

export {
	
}