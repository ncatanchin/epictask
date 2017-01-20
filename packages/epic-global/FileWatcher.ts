import Path = require('path')
import Fs = require('fs')
import Watcher = require('watchr')
import { Map, Record, List } from "immutable"
import { guard } from "./ObjectUtil"
import { EnumEventEmitter } from "type-enum-events"

/**
 * Created by jglanz on 1/16/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


export enum FileWatcherEvent {
	Update,
	Create,
	Delete
}

/**
 * FileWatcher
 *
 * @class FileWatcher
 * @constructor
 **/
export class FileWatcher extends EnumEventEmitter<FileWatcherEvent> {
	
	private static UPDATE = 'update'
	private static CREATE = 'create'
	private static DELETE = 'delete'
	
	private watcher
	
	constructor(private filename:string,private recursive = false,private onReady:((err:Error|string) => any) = null) {
		super(FileWatcherEvent)
		this.filename = Path.resolve(filename)
		this.watcher = Watcher.open(filename,this.onFileChange,this.watcherCallback)
	}
	
	/**
	 * On file change
	 *
	 * @param type
	 * @param changedFilename
	 * @param stat
	 * @param lastStat
	 */
	private onFileChange = (type:string,changedFilename,stat:Fs.Stats,lastStat:Fs.Stats) => {
		switch ( type ) {
			case FileWatcher.UPDATE:
				log.info('type',type,'the file', changedFilename, 'was updated', stat, lastStat)
				this.emit(FileWatcherEvent.Update,changedFilename)
				break
			case FileWatcher.CREATE:
				log.info('type',type,'the file', changedFilename, 'was created', stat)
				this.emit(FileWatcherEvent.Create,changedFilename)
				break
			case FileWatcher.DELETE:
				log.info('type',type,'the file', changedFilename, 'was deleted', lastStat)
				this.emit(FileWatcherEvent.Delete,changedFilename)
				break
		}
	}
	
	/**
	 * Next watch result
	 *
	 * @param err
	 */
	private watcherCallback = err => {
		guard(() => this.onReady(err))
		if (err) {
			log.error(`Failed to start watcher: ${this.filename}`, err)
		} else {
			log.debug(`Watching: ${this.filename}`)
		}
	}
	
	
	/**
	 * Close the watcher
	 */
	close() {
		guard(() => this.watcher && this.watcher.close())
	}
	
}
