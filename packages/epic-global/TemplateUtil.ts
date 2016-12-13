



import { searchPathsForFile } from  "./Files"

const
	log = getLogger(__filename),

	dataUrl = require('dataurl')

let
	app:Electron.App

function getApp() {
	if(!app)
		app = require('epic-electron').app
	
	return app
}

export function toDataUrl(template:Function|string,locals:any = {},mimetype:string = 'text/html'):string {
	if (typeof template === 'function') {
		template = template(locals) as string

	}
	log.info('Using template',template)
	return dataUrl.format({mimetype,data:template})
}


/**
 * Append params to a url
 *
 * @param url
 * @param params
 * @returns {string}
 */
function appendURLParams(url:string, params:{[key:string]:any}) {
	return url + (url.includes('?') ? '&' : '?') +
		Object.keys(params)
			.map(key => `${key}=${encodeURIComponent(params[ key ])}`)
			.join('&')
	
}


/**
 * Gets an entry file
 *
 * @param file
 * @returns {string}
 */
function getEntryFile(file:string) {
	return searchPathsForFile(file)
}


/**
 * Splash entry html path
 *
 * @returns {string}
 */
export function getSplashEntryHtmlPath() {
	return getEntryFile("splash-entry.html")
}

/**
 * App entry html path
 *
 * @returns {string}
 */
export function getBrowserEntryHtmlPath() {
	return getEntryFile("browser-entry.html")
}



export function makeBrowserEntryURL(uri:string, params:{[key:string]:any} = {}) {
	return `file://${getBrowserEntryHtmlPath()}#` + makeURIHash(uri,params)
}

export function makeURIHash(uri:string, params:{[key:string]:any} = {}) {
	return appendURLParams(uri,params)
}

/**
 * Github Auth entry html path
 *
 * @returns {string}
 */
export function getGitHubEntryHtmlPath() {
	return getEntryFile("./github-auth-entry.html")
}

//
//
// export function makeMainTemplate() {
// 	const cssGlobal = require('!!raw!sass!styles/MainEntry.global.scss')
// 	const mainTemplatePath = require('!!file!./MainEntry.jade')
// 	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')
//
// 	const pug = require('pug')
// 	const mainTemplate = pug.render(mainTemplateSrc,{
// 		cssGlobal,
// 		Env,
// 		baseDir:path.resolve(__dirname,'../..'),
// 		Events
// 	})
// 	let templatePath = app.getPath('temp') + '/entry-' + uuid.v4() + '.html'
// 	fs.writeFileSync(templatePath,mainTemplate)
//
// 	templatePath = 'file://' + templatePath
// 	return templatePath
// }
//
//
// export function makeMainDevToolsTemplate() {
// 	const mainTemplatePath = require('!!file!./MainDevToolsWindow.jade')
// 	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')
//
// 	const pug = require('pug')
// 	const mainTemplate = pug.render(mainTemplateSrc,{
// 		Env,
// 		baseDir:path.resolve(__dirname,'../..'),
// 		Events
// 	})
// 	let templatePath = app.getPath('temp') + '/dev-tools-entry-' + uuid.v4() + '.html'
// 	fs.writeFileSync(templatePath,mainTemplate)
//
// 	templatePath = 'file://' + templatePath
// 	return templatePath
// }
