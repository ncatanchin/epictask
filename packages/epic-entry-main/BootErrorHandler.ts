
import Electron from 'electron'

const
	{app,dialog} = Electron,
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
		app.exit(0)
	}
}
