import Path = require('path')
import * as Fs from 'async-file'
import Plugin from "./Plugin"

import { Map, Record, List } from "immutable"
import {
	FileWatcher, guard, FileWatcherEvent, fileExists, setDataOnHotDispose, getHot,
	addHotDisposeHandler
} from "epic-global"
import { PluginLoader } from "epic-plugin-manager/PluginLoader"
import { EnumEventEmitter } from "type-enum-events"

/**
 * Created by jglanz on 1/16/17.
 */

const
	log = getLogger(__filename),
	TIMEOUT = 5000

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

export type TPluginLoaderMap = {[name:string]:PluginLoader}

export enum PluginDirectoryEvent {
	Found,
	Removed
}

/**
 * PluginDirectory
 *
 * @class PluginDirectory
 * @constructor
 **/
class PluginDirectory extends EnumEventEmitter<PluginDirectoryEvent> {
	
	private watcher:FileWatcher
	private watcherUnsubs:Function[]
	private deferred:Promise.Resolver<boolean>
	
	private pluginLoaders:TPluginLoaderMap
	
	/**
	 * Get the directory path/name
	 *
	 * @returns {string}
	 */
	getDirname() {
		return this.dirname
	}
	
	constructor(private dirname:string) {
		super(PluginDirectoryEvent)
		this.dirname = Path.resolve(dirname)
		
		const
			pluginKey = `plugins-${this.dirname}`
		
		this.pluginLoaders = getHot(module,pluginKey,{})
		
		setDataOnHotDispose(module,() => ({[pluginKey]: this.pluginLoaders}))
		addHotDisposeHandler(module,() => this.close())
	}
	
	/**
	 * On Watcher ready callback
	 *
	 * @param err
	 */
	private onWatcherReady = err => err ? this.deferred.reject(err) : this.deferred.resolve(true)
	
	
	/**
	 * On watcher event
	 *
	 * @param event
	 * @param filename
	 */
	private onWatcherEvent = (event:FileWatcherEvent,filename:string) => {
		log.debug(`Event received (${FileWatcherEvent[event]}) for ${filename}`)
		
	}
	
	/**
	 * Process file
	 *
	 * @param file
	 */
	private processFile = async (file) => {
		if (!(await Fs.exists(file)))
			file = Path.resolve(this.dirname,file)
		
		if (!(await Fs.exists(file))) {
			return log.debug(`File does not exist: ${file} - maybe deleted?`)
		}
		
		const
			isValidPlugin = await PluginLoader.isPluginFilename(file)
		
		if (!isValidPlugin) {
			return log.debug(`${file} is not a valid plugin dir or zip`)
		}
		
		
		log.debug(`Processing: ${file}`)
		
		
		try {
			log.debug(`Creating loader for ${file}`)
			
			const
				loader = new PluginLoader(file)
			
			this.pluginLoaders[file] = loader
			
			log.debug(`Init loader for ${file}`)
			await loader.init()
			
			this.emit(PluginDirectoryEvent.Found,loader.getPlugin())
		} catch (err) {
			log.error(`Failed to create & init loader`,err)
		}
		
		
	}
	
	/**
	 * Process all files in dir
	 *
	 * @returns {Promise<void>}
	 */
	private async processAllFiles() {
		const
			files = await Fs.readdir(this.dirname)
		
		for (let file of files) {
			await this.processFile(file)
		}
		
	}
	
	
	/**
	 * Clean the plugin directory
	 */
	private clean() {
		guard(() => this.watcherUnsubs.forEach(it => it()))
		
		if (this.deferred && !this.deferred.promise.isResolved()) {
			this.deferred.reject(new Error(`New open requested`))
		}
		
		if (this.watcher) {
			this.watcher.close()
		}
		
		this.deferred = null
		this.watcher = null
	}
	
	/**
	 * Open and start watching
	 */
	async open():Promise<boolean> {
		
		// CLEAN
		this.clean()
		
		log.debug(`Opening dir: ${this.dirname}`)
		// OPEN
		this.deferred = Promise.defer()
		if (!this.deferred.promise.isResolved()) {
			try {
				const
					stat = await Fs.stat(this.dirname)
				
				if (!stat.isDirectory()) {
					log.warn(`No directory found at ${this.dirname}`)
					this.deferred.reject(`No directory found at ${this.dirname}`)
				} else {
					await this.processAllFiles()
					this.watcher = new FileWatcher(this.dirname, true, this.onWatcherReady)
					this.watcherUnsubs = this.watcher.onAll(this.onWatcherEvent)
					await this.deferred.promise.timeout(TIMEOUT)
				}
			} catch (err) {
				log.error(`Failed to open watcher`)
				this.clean()
				this.deferred.reject(err)
			}
		}
		return
	}
	
	/**
	 * Close plugin directory
	 */
	close() {
		guard(() => this.clean())
	}
	
}

export default PluginDirectory