import * as fs from 'fs'
import {getUserDataFilename, readFileSync} from './util/Files'
import {Property} from "./util/Decorations";
import {Repo} from './GitHubModels'
import {toJSON} from "./util/JSONUtil";

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

/**
 * Application settings object
 */
class SettingsFile {

	constructor() {
		this.load()
	}


	@Property({enumerable:false,jsonInclude:true})
	isLoaded:boolean

	@Property(visiblePropOpts)
	token:string

	@Property(visiblePropOpts)
	repoId:number

	save() {
		const settingsToSave = JSON.stringify(this,(k,v) => {
			return (k === 'isLoaded') ? undefined : v
		},4)

		log.info('Saving', settingsToSave)
		fs.writeFileSync(settingsFilename,settingsToSave)

		return this
	}

	load() {
		let newSettings = null
		try {
			if (fs.existsSync(settingsFilename)) {
				newSettings = JSON.parse(readFileSync(settingsFilename),(k,v) => {
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
		this.isLoaded = true
		return this
	}

	toJSON() {
		return toJSON(this)
	}
}

export const Settings = new SettingsFile()
export default Settings
