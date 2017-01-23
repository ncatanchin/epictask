import * as Path from 'path'
import * as Fs from 'async-file'

import shx = require('shelljs')
import decompress = require('decompress')

import { fileExists, cachePath } from "epic-global"
import { getValue, isNil, isFunction } from "typeguard"

const
	log = getLogger(__filename)

export async function unpackPluginZip(zipFilename:string) {
	const
		 zipBasename = Path.basename(zipFilename, '.zip')
	
	try {
		const
			zipTimestamp = moment((await Fs.stat(zipFilename)).mtime).valueOf(),
			unpackDirname = Path.resolve(cachePath, 'plugins-unpacked', zipBasename),
			unpackExists = !fileExists(unpackDirname),
			unpackTimestamp = !unpackExists ?
				0 :
				moment((await Fs.stat(unpackDirname)).mtime).valueOf()
		
		
		if (zipTimestamp > unpackTimestamp) {
			
			
			if (unpackExists) {
				log.debug(`Removing unpack dir: ${unpackDirname}`)
				shx.rm('-Rf', unpackDirname)
			}
			
			log.debug(`Creating unpack dir: ${unpackDirname}`)
			shx.mkdir('-p', unpackDirname)
		}
		
		return unpackDirname
	} catch (err) {
		log.error(`Failed to unpack ${zipFilename}`,err)
		throw err
	}
	
}


/**
 * Validate a plugin is valid
 *
 * @param o
 * @returns {boolean}
 */
export function validatePlugin(o:any):o is IPlugin {
	return !isNil(o) &&
		['name','version','context'].every(prop => o.hasOwnProperty(prop)) &&
		['start','stop'].every(it => isFunction(o[it]))
}


export function isPluginEnabled(config:IPluginConfig) {
	return getValue(() => config && config.enabled !== false, true)
}