

import {app} from 'electron'

const userDataPath = app.getPath('userData')

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}