import { Map, Record, List } from "immutable"
import shx = require('shelljs')
import decompress = require('decompress')

import { FileWatcherEvent, fileExists, cachePath, isDirectory, cloneObjectShallow, isZipFile } from "epic-global"


import * as Path from 'path'
import * as Fs from 'async-file'
import { isDefined, getValue, isFunction } from "typeguard"
import { unpackPluginZip } from "./PluginUtils"
import { PluginModuleLoader } from "./PluginModuleLoader"

const Module = require('module')

/**
 * Created by jglanz on 1/19/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)



/**
 * Plugin
 *
 * @class Plugin
 * @constructor
 **/
export class PluginFile {
	
	/**
	 * Get the JSON descriptor for a plugin
	 *
	 * @param filename
	 * @returns {Promise<null>}
	 */
	static async getPluginDescriptor(filename:string) {
		try {
			const
				pkgFilename = Path.resolve(filename,'package.json')
			
			if (!fileExists(pkgFilename))
				return null
			
			const
				pkgJson = await Fs.readFile(pkgFilename),
				pkg = JSON.parse(pkgJson)
			
			return pkg && pkg.epictaskPlugin && pkg.main ? pkg : null
		} catch (err) {
			return null
		}
	}
	
	/**
	 * Check if directory && if there is a package.json in there && epictask prop
	 *
	 * @param filename
	 * @returns {Promise<any|boolean>}
	 */
	static async isPluginDir(filename:string) {
		const
			isDir = (await Fs.stat(filename)).isDirectory()
		
		return (isDir) ?
			isDefined(await PluginFile.getPluginDescriptor(filename)) :
			false
	}
	
	/**
	 * Determine if the file is a valid plugin file
	 *
	 * @param filename
	 * @returns {Promise<boolean|boolean|boolean>}
	 */
	static async isPluginFilename(filename:string) {
		const
			isDir = await PluginFile.isPluginDir(filename),
			isZip = !isDir && _.toLower(Path.extname(filename)) === '.zip'
		
		return isZip || isDir
		
	}
	
	/**
	 * Directory that has the unpacked plugin
	 */
	private dirname:string
	
	/**
	 * package.json
	 */
	private pkg:any
	
	/**
	 * Is a directory
	 */
	private isDir:boolean
	
	/**
	 * Is a zip
	 */
	private isZip:boolean
	
	private fileChanged = false
	
	private fileUpdateDeferred:Promise.Resolver<IPluginConfig>
	
	config:IPluginConfig
	
	
	/**
	 * Construct plugin loader
	 *
	 * @param dirOrZipname
	 */
	constructor(private dirOrZipname:string) {
		assert(Env.isMain,`Plugin file only loads on main`)
		assert(fileExists(dirOrZipname),`Directory or zip with filename does not exist: ${dirOrZipname}`)
	}
	
	
	/**
	 * unpack the zip file
	 *
	 * @returns {Promise<string>}
	 */
	private unpackZip() {
		if (this.dirname && isDirectory(this.dirname)) {
			log.debug(`Cleaning directory before unpack: ${this.dirname}`)
			shx.rm('-Rf',this.dirname)
		}
		
		return unpackPluginZip(this.dirOrZipname)
	}
	
	/**
	 * Update / this only does something if the file is a zip file
	 * in which case it extracts the file again
	 * @returns {Promise<IPluginConfig>}
	 */
	async update():Promise<IPluginConfig> {
		const
			{fileUpdateDeferred} = this
		
		if (fileUpdateDeferred) {
			this.fileChanged = true
			
			return (await this.fileUpdateDeferred.promise)
		}
		
		// WE ARE STARTING NOW, SO CLEAR FLAG
		this.fileChanged = false
		this.fileUpdateDeferred = Promise.defer()
		
		// UPDATE / Re-unpack the file
		if (this.isZip) {
			await this.unpackZip()
		}
		
		
		const
			{fileChanged} = this
		
		this.fileChanged = false
		this.fileUpdateDeferred = null
		
		// IF THE FILE CHANGED AGAIN
		if (fileChanged) {
			await this.update()
		}
		
		fileUpdateDeferred.resolve(this.config)
		return this.config
		
	}
	
	/**
	 * Initialize the loader
	 *
	 * @returns {Promise<IPluginFileInfo>}
	 */
	async init():Promise<IPluginConfig> {
		try {
			this.isDir = await PluginFile.isPluginDir(this.dirOrZipname)
			this.isZip = !this.isDir && isZipFile(this.dirOrZipname)
			this.dirname = this.isZip ? (await this.unpackZip()) : this.dirOrZipname
			this.pkg = await PluginFile.getPluginDescriptor(this.dirname)
			
			assert(this.pkg,`failed to read package config from dir ${this.dirname}`)
			const
				{name,description,version,main} = this.pkg
			
			let
				mainBasename = Path.resolve(this.dirname,main),
				mainBasenameExtended = mainBasename + '.js'
			
			assert(fileExists(mainBasename) || fileExists(mainBasenameExtended),`Main file for plugin does not exist (${main}): ${mainBasename} / ${mainBasenameExtended}`)
			
			
			return this.config = {
				name,
				description,
				version,
				main: fileExists(mainBasename) ? mainBasename : mainBasenameExtended,
				dirname: this.dirname,
				filename: this.dirOrZipname,
				isZip: this.isZip,
			}
			
			
			
		} catch (err) {
			log.error(`Failed to init plugin: ${this.dirOrZipname}`,err)
			getNotificationCenter().notifyError(`Unable to init plugin (${this.dirOrZipname}): ${err.message}`)
		}
	}
	
	
	
	/**
	 * Handle a file watcher event
	 *
	 * @param event
	 * @param filename
	 */
	handleFileWatcherEvent = (event:FileWatcherEvent,filename:string) => {
		// IF EVENT WAS CONSUMED THEN RETURN TRUE
		return false
	}
	
}

export default PluginFile

declare global {
	interface IPluginFile extends PluginFile {}
	
	
}