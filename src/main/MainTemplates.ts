const log = getLogger(__filename)
import * as fs from 'fs'
import * as path from 'path'
import electron = require('electron')
import uuid = require('node-uuid')

const {app} = electron
const dataUrl = require('dataurl')
import {Events} from 'shared/Constants'

export function toDataUrl(template:Function|string,locals:any = {},mimetype:string = 'text/html'):string {
	if (typeof template === 'function') {
		template = template(locals) as string

	}
	log.info('Using template',template)
	return dataUrl.format({mimetype,data:template})
}


export function makeMainTemplate() {
	const cssGlobal = require('!!raw!sass!styles/MainEntry.global.scss')
	const mainTemplatePath = require('!!file!./MainEntry.jade')
	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')

	const pug = require('pug')
	const mainTemplate = pug.render(mainTemplateSrc,{
		cssGlobal,
		Env,
		baseDir:path.resolve(__dirname,'../..'),
		Events
	})
	let templatePath = app.getPath('temp') + '/entry-' + uuid.v4() + '.html'
	fs.writeFileSync(templatePath,mainTemplate)

	templatePath = 'file://' + templatePath
	return templatePath
}


export function makeMainDevToolsTemplate() {
	const mainTemplatePath = require('!!file!./MainDevToolsWindow.jade')
	const mainTemplateSrc = fs.readFileSync(mainTemplatePath,'utf-8')

	const pug = require('pug')
	const mainTemplate = pug.render(mainTemplateSrc,{
		Env,
		baseDir:path.resolve(__dirname,'../..'),
		Events
	})
	let templatePath = app.getPath('temp') + '/dev-tools-entry-' + uuid.v4() + '.html'
	fs.writeFileSync(templatePath,mainTemplate)

	templatePath = 'file://' + templatePath
	return templatePath
}
