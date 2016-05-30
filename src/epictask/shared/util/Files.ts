

const  electron = require('electron')

const app = electron.app || electron.remote.app
const userDataPath = app.getPath('userData')
const fs = require('fs')

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}

export function readFileSync(filename:string) {
	return fs.readFileSync(filename,'utf-8')
}