import Electron = require('electron')



const
	log = getLogger(__filename),
	{autoUpdater,dialog} = Electron,
	isWindows = process.platform === 'win32',
	isMac = process.platform === 'darwin',
	isLinux = !isWindows && !isMac,
	platform = isWindows ? 'windows' : isMac ? 'macos' : 'linux',
	baseUrl = "http://localhost:3000",
	//baseUrl = "https://epictask.densebrain.com",
	feedUrl = `${baseUrl}/update/electron/${platform}/${VERSION}`

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

log.info(`Using feed URL: ${feedUrl}`)
autoUpdater.setFeedURL(feedUrl)

autoUpdater.on('error',(event,err) => {
	log.error(`Error occurred`,err)
})

autoUpdater.on('checking-for-update',(event) => {
	log.info(`Checking for update`)
})

autoUpdater.on('update-available',(event) => {
	log.info(`Update available, downloading probably`)
})

autoUpdater.on('update-not-available',(event) => {
	log.info(`no update currently available`)
})

autoUpdater.on('update-downloaded',(event,notes,name,releaseDate,updateURL) => {
	log.info(`Release downloaded, notes`,notes,'name',name,'date',releaseDate,'url',updateURL)
	
	askUpdate(name,updateURL,notes,releaseDate)
})

log.info(`Checking for updates - started`)
autoUpdater.checkForUpdates()


/**
 * Ask the user to update
 *
 * @param name
 * @param updateUrl
 * @param notes
 * @param releaseDate
 */
function askUpdate(name,updateUrl,notes,releaseDate) {
	dialog.showMessageBox(null,{
		type: 'question',
		buttons: ['Later', 'Update Now'],
		cancelId: 0,
		defaultId: 1,
		message: `New update available, install?`,
		detail: notes
	},index => {
		if (index === 0)
			return
		
		autoUpdater.quitAndInstall()
	})
}