import {getAppConfig} from "shared/AppConfig"
const log = getLogger(__filename)

const uuid = require('node-uuid')
const mkdirp = require('mkdirp')

const fs = require('fs')
const path = require('path')
const dataUrl = require('dataurl')

const fileProto = 'file://'
const httpProto = 'http://'
const httpsProto = 'https://'
const protos = [fileProto,httpProto,httpProto]



function getPaths() {
	const ensureDir = (dir) => {
		if (!fs.existsSync(dir))
			fs.mkdirSync(dir)
		
		return dir
	}
	
	const {userDataPath,cachePath,tempPath} = getAppConfig().paths
	return [userDataPath,cachePath,tempPath].map(ensureDir)
	
}

const [userDataPath,cachePath,tempPath] = getPaths()

log.info(`Using cache path: ${cachePath}`)
mkdirp.sync(cachePath)


export function isUrl(testUrl:string) {
	for (let proto of protos) {
		if (_.startsWith(testUrl,proto))
			return true
	}

	return false
}


function fixedEncodeURI (str) {
	return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}

export function getUserDataFilename(filename:string) {
	return `${userDataPath}/${filename}`
}

export function absoluteFilename(filename) {
	return (fs.existsSync(filename)) ?
		path.resolve(filename) : path.resolve(Env.baseDir,filename)
}

export function cacheFilename(basename:string) {
	return `${cachePath}/${encodeURIComponent(basename)}.cache`
}

export function tempFilename(basename:string) {
	return `${tempPath}/${encodeURIComponent(basename)}-${uuid.v4()}.tmp`
}

/**
 * Convert a relative file path to a url
 *
 * @param filename
 * @returns {string}
 */
export function filePathToUrl(filename) {
	if (isUrl(filename))
		return filename

	const realFilename = absoluteFilename(filename)
	const fileUrl = `file://${realFilename}`
	log.debug(`Created file (${filename}) / real filename (${realFilename}) / url ${fileUrl}`)
	return fileUrl
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
export function readFile(filename:string,encoding = 'utf-8') {
	try {
		if (!fs.existsSync(filename))
			return null

		return fs.readFileSync(filename, encoding)
	} catch (err) {
			if (err.code === 'ENOENT')
				return null

		throw err
	}
}


/**
 * Reads a file from disk, if it does not exist
 * or any ENOENT exception occurs a `null` is returned
 *
 * @param filename
 * @returns {any}
 */
export async function readFileAsync(filename:string,encoding = 'utf-8') {
	try {
		if (!fs.existsSync(filename))
			return null

		return await fs.readFile(filename, encoding)
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


export async function getUrl(url:string) {
	if (_.startsWith(url,fileProto)) {
		url = url.substring(fileProto.length)
		log.debug(`Parse local file url: ${url}`)
		return await fs.readFile(url)
	} else {
		const res = await fetch(url)
		return await res.arrayBuffer()
	}
}

/**
 * Cache a remote url in app path / caches
 *
 * @param url
 * @returns {string}
 */
export async function cacheUrl(url:string) {


	if (_.startsWith(url,fileProto)) {
		url = url.substring(fileProto.length)
		log.debug(`Detected local file: ${url}`)
		return url
	}

	const cacheFile = cacheFilename(url)
	const exists = await fs.exists(cacheFile)

	if (exists)
		return cacheFile

	log.debug(`Caching file to cache/temp ${url} > ${cacheFile}`)

	let data = await getUrl(url)

	log.debug(`Writing file to cache/temp ${url} > ${cacheFile}`)
	await fs.writeFile(cacheFile,new Buffer(data))
	return cacheFile
}

/**
 * Read a url file or http, etc
 * and convert it into a data url
 *
 * @param url
 * @param mimetype
 * @returns {any}
 */
export async function getDataUrlFromUrl(url:string,mimetype:string = 'image/png') {
	let data = null
	if (_.startsWith(url,fileProto)) {
		url = url.substring(fileProto.length)
		log.debug(`Detected local file: ${url}`)

		data = await readFileAsync(url)

	} else {
		data = await getUrl(url)
	}

	return dataUrl.format({mimetype,data})

}