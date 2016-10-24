import * as fs from 'fs'
import {getUserDataFilename, readFile} from  "../Files"
import {Property} from  "../Decorations"
import {toJSONObject} from  "../JSONUtil"
// import {User} from 'epic-models'
import {ISettings} from "./Settings"


const
	log = getLogger(__filename),
	settingsFilename = getUserDataFilename('epictask-settings.json')

log.info(`Settings file: ${settingsFilename}`)

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
export class SettingsFile implements ISettings {
	
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
	user:any
	
	
	/**
	 * Save the current settings to disk
	 *
	 * @returns {SettingsFile}
	 */
	save() {
		
		const settingsToSave = JSON.stringify(_.pick(this,'disableAutoSync','token','user'),null,4)
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
			if (ProcessConfig.isStorybook()) {
				newSettings = {}
			} else if (fs.existsSync(settingsFilename)) {
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
		
		// if (this.user)
		// 	this.user = new User(this.user)
		
		this.isLoaded = true
		
		log.debug(`Loaded github token: ${this.token}`)
		
		return this
	}
	
	toJSON() {
		return toJSONObject(this) as ISettings
	}
}

/**
 * Create the settings file instance
 *
 * @type {SettingsFile}
 */
export const Settings = new SettingsFile()

export default Settings

if (DEBUG)
	_.assignGlobal({Settings,SettingsFile})

if (module.hot) {
	module.hot.accept()
}
