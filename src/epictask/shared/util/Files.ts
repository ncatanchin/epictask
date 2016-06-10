

const  electron = require('electron')

const app = electron.app || electron.remote.app
const userDataPath = app.getPath('userData')
const fs = require('fs')

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}


/**
 * Read a file and parse to JSON object
 * if file does not exist, returns null
 *
 * @param filename
 * @returns {Object}
 */
export function readJSONFile(filename:string) {
	const data = readFile(filename)
	if (data) {
		return JSON.parse(data)
	}
	return null
}

/**
 * Reads a file from disk, if it does not exist
 * or any ENOENT exception occurs a `null` is returned
 *
 * @param filename
 * @returns {any}
 */
export function readFile(filename:string) {
	try {
		if (!fs.existsSync(filename))
			return null

		return fs.readFileSync(filename, 'utf-8')
	} catch (err) {
			if (err.code === 'ENOENT')
				return null

		throw err
	}
}

/**
 * Write json file synchronously
 *
 * @param filename
 * @param json
 * @returns {any}
 */
export function writeJSONFile(filename:string, json:Object) {
	return writeFile(filename,JSON.stringify(json))
}

/**
 * Write json file async
 *
 * @param filename
 * @param json
 * @returns {any}
 */
export async function writeJSONFileAsync(filename:string, json:Object) {
	return await writeFileAsync(filename,JSON.stringify(json))
}

/**
 * Write file synchronously
 *
 * @param filename
 * @param data
 * @returns {any}
 */
export function writeFile(filename:string, data:any) {

	return fs.writeFileSync(filename,data)
}

/**
 * Write file async
 *
 * @param filename
 * @param data
 * @returns {any}
 */
export async function writeFileAsync(filename:string, data:any) {
	return await fs.writeFile(filename,data)
}