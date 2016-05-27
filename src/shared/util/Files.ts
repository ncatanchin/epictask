

import * as electron from 'electron'

const app = electron.app || electron.remote.app
const userDataPath = app.getPath('userData')

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}