import Electron from 'electron'

const
		{app,ipcMain} = Electron,
		workerId = process.env.ELECTRON_WORKER_ID,
		log = getLogger(__filename)

//On App Ready - Start!!
app.on('ready',() => {
	log.info('Booted into Jobs Worker')
})


if (module.hot) {
	module.hot.accept(() => log.info('Hot reloaded'))
}