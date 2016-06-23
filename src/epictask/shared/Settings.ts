import * as fs from 'fs'
import {getUserDataFilename, readFile} from './util/Files'
import {Property} from "./util/Decorations";
import {toJSON} from "./util/JSONUtil";
import {User} from 'shared/models'

const log = getLogger(__filename)
const settingsFilename = getUserDataFilename('settings.db')
log.info(`Settings file: ${settingsFilename}`)

// const low = require('lowdb')
// const storage = require('lowdb/file-sync')
// const db = low(settingsFilename,{storage})

/**
 * Create default settings
 */
function defaultSettings() {
	return {

	}
}

/**
 * Setting change listener listener
 *
 * @param propertyKey
 * @param newVal
 */
function onChange(propertyKey:string, newVal:any) {
	this.isLoaded && this.save()
}

const visiblePropOpts = {onChange,jsonInclude:true}


export interface ISettings {
	isLoaded?:boolean
	token?:string
	disableAutoSync?:boolean
}

/**
 * Application settings object
 */
class SettingsFile implements ISettings {

	constructor() {
		this.load()
	}


	@Property({enumerable:false,jsonInclude:true})
	isLoaded:boolean

	@Property(visiblePropOpts)
	token:string

	@Property(visiblePropOpts)
	disableAutoSync:boolean

	@Property(visiblePropOpts)
	user:User


	/**
	 * Save the current settings to disk
	 *
	 * @returns {SettingsFile}
	 */
	save() {
		const settingsToSave = JSON.stringify(this,(k,v) => {
			return (k === 'isLoaded') ? undefined : v
		},4)

		log.debug('Saving', settingsToSave)
		fs.writeFileSync(settingsFilename,settingsToSave)

		return this
	}

	/**
	 * Load settings from disk
	 *
	 * @returns {SettingsFile}
	 */
	load() {
		let newSettings = null
		try {
			if (fs.existsSync(settingsFilename)) {
				newSettings = JSON.parse(readFile(settingsFilename),(k, v) => {
					return (k === 'isLoaded') ? undefined : v
				})
			}
		} catch (err) {
			log.warn(`failed to read settings: ${settingsFilename}`,err)
		} finally {
			if (!newSettings) {
				newSettings = defaultSettings()
			}
		}

		Object.assign(this,newSettings)

		if (this.user)
			this.user = new User(this.user)

		this.isLoaded = true

		log.debug(`Loaded github token: ${this.token}`)

		return this
	}

	toJSON() {
		return toJSON(this)
	}
}

export const Settings = new SettingsFile()
export default Settings
