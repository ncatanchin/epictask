
import Electron = require('electron')
const {app,BrowserWindow,ipcMain} = Electron

const DatabaseServerEvents = {
	Request: 'Request',
	Response: 'Response'
}

const log = getLogger(__filename)

class DatabaseServer {

	private dbWindow:Electron.BrowserWindow

	start():Promise<any> {
		return new Promise((resolve,reject) => {
			try {

				const bgWindow = new BrowserWindow({
					show: false
				})

				ipcMain.on('test-bg-request',(event,arg1) => {
					log.info('bg window message received')
					event.sender.send('test-bg-response',arg1)
				})

				ipcMain.on('test-end',(event) => {
					log.info('test-end received')
					bgWindow.close()
				})


				bgWindow.webContents.on('did-fail-load',(event,code,desc,url,mainFrame) => {
					log.error('web content failed to load',event,code,desc,url)

					done(new Error(desc))
				})

				bgWindow.on('did-finish-load',() => {
					log.info('bg window loaded, should get a message AFTER this')
				})

				bgWindow.on('closed',() => {
					log.info('window closed, test is done')
					done()
				})

				bgWindow.loadURL(bgTestHtml)

			} catch (err) {
				log.error('bg window failed', err)
				done(err)
			}
		})
	}


}