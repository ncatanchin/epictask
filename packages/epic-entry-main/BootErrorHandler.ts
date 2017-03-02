
import Electron from 'epic-electron'

const
	{app,dialog, BrowserWindow} = Electron,
	log = getLogger(__filename)

export function handleError(title:string,message:string,err:Error) {
	const result = dialog.showMessageBox(null,{
		type: 'error',
		buttons: ['Reset','Exit'],
		title,
		message
	})
	
	log.info(`Database failed user response: ${result}`)
	if (result === 0) {
		require('./Cleaner').default.restartAndClean()
	} else {
		try {
			BrowserWindow.getAllWindows().forEach(win => {
				try {
					win.destroy()
				} catch (err) {}
			})
		} catch (err) {}
		process.exit(0)
		app.exit(0)
	}
}
