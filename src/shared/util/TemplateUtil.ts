

import electron = require('electron')
import uuid = require('node-uuid')

const
	log = getLogger(__filename),

	{app} = electron,
	dataUrl = require('dataurl')
	

export function toDataUrl(template:Function|string,locals:any = {},mimetype:string = 'text/html'):string {
	if (typeof template === 'function') {
		template = template(locals) as string

	}
	log.info('Using template',template)
	return dataUrl.format({mimetype,data:template})
}

function getEntryFile(file:string) {
	const
		appPaths = [
			'../dist/app',
			'../app',
			'..',
			'.',
			'../../../app'
		]
	
	let
		outBuf = '',
		resolvedPath = null,
		fs = require('fs')
	
	const logOut = (...args) => {
		outBuf += args.join(' // ') + '\n'
	}
	
	for (let appPath of appPaths) {
		try {
			appPath = __non_webpack_require__.resolve(`${appPath}/${file}`)
			
			if (fs.existsSync(appPath)) {
				resolvedPath = appPath
				logOut(`Found at ${resolvedPath}`)
				break
			}
		} catch (err) {
			logOut(`Failed to find at path ${appPath} ${err.message} ${err}`)
		}
	}
	
	if (!resolvedPath) {
		throw new Error(`Unable to find app entry template: ${outBuf}`)
	}
	
	return resolvedPath
}


export function getSplashEntryHtmlPath() {
	return getEntryFile("splash-entry.html")
}

export function getAppEntryHtmlPath() {
	return getEntryFile("app-entry.html")
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
