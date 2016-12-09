import {getAppConfig} from "epic-entry-shared/AppConfig"

const
	log = getLogger(__filename),

	uuid = !ProcessConfig.isStorybook() && require('node-uuid'),
	mkdirp = !ProcessConfig.isStorybook() && require('mkdirp'),

	fs = require('fs'),
	fsp = Promise.promisifyAll(fs),
	path = require('path'),
	dataUrl = require('dataurl'),
	
	fileProto = 'file://',
	httpProto = 'http://',
	httpsProto = 'https://',
	
	protos = [
		fileProto,
		httpProto,
		httpProto
	]




function getPaths() {
	const
		ensureDir = (dir) => {
			if (!fs.existsSync(dir))
				fs.mkdirSync(dir)
			
			return dir
		}
	
	const
		{
			userDataPath,
			cachePath,
			tempPath
		} = getAppConfig().paths
	
	return (ProcessConfig.isStorybook()) ?
		[userDataPath,cachePath,tempPath] :
		[userDataPath,cachePath,tempPath].map(ensureDir)
	
}

const [userDataPath,cachePath,tempPath] = getPaths()

//log.info(`Using cache path: ${cachePath}`)
if (!ProcessConfig.isStorybook())
	mkdirp.sync(cachePath)



export const UTF8 = 'utf-8'

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

export function tempFilename(basename:string,ext = 'tmp') {
	return `${tempPath}/${encodeURIComponent(basename)}-${uuid ? uuid.v4() : Date.now()}.${ext}`
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
	const
		data = readFile(filename,UTF8)
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
 * @param encoding
 * @returns {any}
 */
export function readFile(filename:string,encoding = null) {
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
 * @param encoding
 * @returns {any}
 */
export async function readFileAsync(filename:string,encoding = null) {
	try {
		if (!fs.existsSync(filename))
			return null

		return await fsp.readFileAsync(filename, encoding)
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

export const searchPathDefaults = [
	'.',
	'./dist/app',
	'./dist/app-package',
	'./build',
	'dist/app',
	'dist/app-package',
	'../dist/app',
	'../dist/app-package',
	'../app',
	'..',
	'../../../app'
]

/**
 * Search paths for a file
 *
 * @param filename
 * @param searchPaths
 *
 * @returns {string}
 */
export function searchPathsForFile(filename:string,...searchPaths:string[]) {
	
	const
		fs = require('fs')
	
	try {
		if (fs.existsSync(filename))
			return filename
	} catch (err) {}
	/**
	 * APP SEARCH PATHS FOR ASAR
	 */
	if (searchPaths.length === 0)
		searchPaths.push(...searchPathDefaults)
	
	let
		resolvedPath = null,
		resourcePath = null
	
	
	for (let searchPath of searchPaths) {
		try {
			const
				baseResourcePath = path.join(searchPath,filename)
			
			log.info(`Looking for ${filename} using base path ${baseResourcePath} @ ${searchPath}`)
			try {
					const
						hardPath = path.resolve(baseResourcePath)
				
					if (fs.existsSync(hardPath)) {
						resolvedPath = hardPath
						log.info(`Found at hard path: ${hardPath}`)
						break
					}
			} catch (err) {
				log.info(`File not avail at hard path: ${baseResourcePath}`)
			}
			
			resourcePath = __non_webpack_require__.resolve(baseResourcePath)
			
			if (fs.existsSync(resourcePath)) {
				resolvedPath = resourcePath
				log.info(`Found at ${resolvedPath}`)
				break
			}
		} catch (err) {
			log.warn(`Failed to find at path ${searchPath}/${resourcePath}/${filename} ${err.message} ${err}`)
		}
	}
	
	return resolvedPath
	
}