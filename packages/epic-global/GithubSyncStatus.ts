import { getUserDataFilename} from  "./Files"
import {toJSON, parseJSON } from "epic-util"
import { isNumber } from "typeguard"
import { PersistentValue, PersistentValueEvent } from "epic-global/PersistentValue"

const
	log = getLogger(__filename),
	syncStatusFilename = getUserDataFilename('epictask-sync-status.json'),
	statusValue = new PersistentValue<IGithubSyncStatus>(
		'GithubSyncStatus',
		{
			eTags: {},
			timestamps: {}
		} as IGithubSyncStatus,
		val => toJSON(val),
		val => parseJSON(val)
	)

log.debug(`SyncStatusFilename file: ${syncStatusFilename}`)

export interface IGithubSyncStatus {
	eTags:{[url:string]:string}
	timestamps:{[url:string]:number}
}


export namespace GithubSyncStatus {
	
	let
		status:IGithubSyncStatus = statusValue.get()
	
	// LISTEN FOR CHANGES
	statusValue.on(PersistentValueEvent.Changed,(event,newStatus) => status = newStatus)
	
	/**
	 * Save status value
	 *
	 * @returns {Promise<void>}
	 */
	function save() {
		statusValue.set(status)
	}
	
	
	
	
	/**
	 * Check to ensure status is loaded
	 */
	function checkLoaded() {
		assert(status,`Can not update or read sync status before loaded`)
	}
	
	/**
	 * Clear a given prefix
	 *
	 * @param prefix
	 */
	export function clearPrefix(prefix:string) {
		if (!status)
			return
		
		for (let map of [status.eTags,status.timestamps]) {
			Object
				.keys(map)
				.filter(key => key.startsWith('' + prefix))
				.forEach(key => {
					delete map[key]
				})
		}
		
		save()
		
			
	}
	
	/**
	 * Set a resource eTag
	 * @param url
	 * @param eTag
	 */
	export function setETag(url:string,eTag:string) {
		checkLoaded()
		
		status.eTags[url] = eTag
		save()
	}
	
	/**
	 * Get the last ETag for a URL
	 *
	 * @param url
	 */
	export function getETag(url:string) {
		checkLoaded()
		return status.eTags[url]
	}
	
	
	/**
	 * Set a timestamp for a url resource
	 *
	 * @param url
	 * @param timestamp
	 */
	export function setTimestamp(url:string,timestamp:number|Date) {
		checkLoaded()
		
		status.timestamps[url] = timestamp instanceof Date ? timestamp.getTime() : timestamp
		save()
	}
	
	
	/**
	 * Get last resource timestamp
	 *
	 * @param url
	 * @returns {Date}
	 */
	export function getTimestamp(url) {
		checkLoaded()
		return status.timestamps[url]
	}
	
	
	/**
	 * Get a set of params, github style {since:timestamp8601}
	 *
	 * @param url
	 * @param maxAgeMillis
	 * @returns {{}|{since: string}}
	 */
	export function getSinceTimestampParams(url:string, maxAgeMillis = -1) {
		let
			timestamp = getTimestamp(url)
		
		if (!timestamp && maxAgeMillis > 0) {
			timestamp = Date.now() - maxAgeMillis
		}
		return {
			since:
				moment(!timestamp ?
					new Date(1) :
					isNumber(timestamp) ?
						new Date(timestamp) :
						timestamp
				).format()
		}
	}
	
	
	/**
	 * Find the most recent timestamp and update the status store
	 * based on specified property fields on the models provided
	 *
	 * @param url
	 * @param models
	 * @param props
	 */
	export function setMostRecentTimestamp(url:string,models:any[],...props:string[]):void {
		const
			maxTimestamp = models.reduce((maxTimestamp,nextModel) => {
				const modelTimestamp = props
					.map(prop => nextModel[prop])
					.filter(val => (['number','string'].includes(typeof val) || val instanceof Date))
					.map(val => moment(val))
					.filter(val => val.isValid())
					.reduce((maxVal,nextVal) =>
						Math.max(nextVal.valueOf(),maxVal)
					,0),
					newMax = Math.max(modelTimestamp,maxTimestamp)
				
				return isNaN(newMax) ? maxTimestamp : newMax
				
			},0),
			currentMaxTimestamp = getTimestamp(url)
		
		if (maxTimestamp > 0 && typeof maxTimestamp === 'number' && (!currentMaxTimestamp || maxTimestamp > currentMaxTimestamp))
			setTimestamp(url,maxTimestamp)
	}
	
	
}

/**
 * Export each namespace function individually
 */
// export const {
// 	awaitLoaded,
// 	clearPrefix,
// 	getTimestamp,
// 	setTimestamp,
// 	getETag,
// 	setETag
// } = GithubSyncStatus



export default GithubSyncStatus