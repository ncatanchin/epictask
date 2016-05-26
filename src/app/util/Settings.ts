import {getUserDataFilename} from './Files'
import * as fs from 'fs'
import * as _ from 'lodash'

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
 * Load settings from disk
 */
function load() {
	let newSettings = null
	try {
		if (fs.existsSync(settingsFilename)) {
			newSettings = JSON.parse(fs.readFileSync(settingsFilename,'utf-8'))
		}
	} catch (err) {
		log.warn(`failed to read settings: ${settingsFilename}`,err)
	} finally {
		if (!newSettings) {
			newSettings = defaultSettings()
		}
	}

	return newSettings
}

/**
 * Settings JSON Object
 */
const settings = load()

function save() {
	fs.writeFileSync(settingsFilename,JSON.stringify(settings,null,4))

	return settings
}

export function get<T>(key:string):T {
	return _.get(settings,key) as T
}

export function set(key:string,value:any) {
	settings[key] = value
	save()
}