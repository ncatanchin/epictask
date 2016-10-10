
const
	log = getLogger(__filename),
	{shell,app} = require('electron'),
	ghUrlRegEx = /github\.com\/(login|api)/


app.on('web-contents-created',(event,webContents) => {
	webContents.on('will-navigate',(event:any,url) => {
		log.info(`App wants to navigate`,url)
		
		if (!ghUrlRegEx.test('https://github.com/login') && url.startsWith('http')) {
			shell.openExternal(url)
		}
		
		event.returnValue = false
		event.preventDefault()
	})
})

log.info(`Bound to navigate`)

export {
	
}