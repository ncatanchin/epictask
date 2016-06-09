

const  electron = require('electron')

const app = electron.app || electron.remote.app
const userDataPath = app.getPath('userData')
const fs = require('fs')

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}

export function readJSONFileSync(filename:string) {
	const data = readFileSync(filename)
	if (data) {
		return JSON.parse(data)
	}
	return null
}

export function readFileSync(filename:string) {
	if (!fs.existsSync(filename))
		return null

	return fs.readFileSync(filename,'utf-8')
}

export function writeJSONFileSync(filename:string,json:Object) {
	return writeFileSync(filename,JSON.stringify(json))
}

export function writeFileSync(filename:string,data:any) {

	return fs.writeFileSync(filename,'utf-8')
}