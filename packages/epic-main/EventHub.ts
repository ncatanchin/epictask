


import {ipcMain} from 'electron'

const
	log = getLogger(__filename)

ipcMain.on('test',(event,...args) => {
	log.info(`RECEIVED MESSAGE`,event,...args)
})