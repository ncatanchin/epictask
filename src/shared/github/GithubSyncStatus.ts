import * as fs from 'fs'
import * as moment from 'moment'
import { getUserDataFilename } from "shared/util/Files"
import { toJSON, parseJSON } from "shared/util/JSONUtil"

const
	log = getLogger(__filename),
	syncStatusFilename = getUserDataFilename('epictask-sync-status.json')

log.info(`SyncStatusFilename file: ${syncStatusFilename}`)

interface IGithubSyncStatus {
	eTags:{[url:string]:string}
	timestamps:{[url:string]:number}
}


export namespace GithubSyncStatus {
	
	let
		status:IGithubSyncStatus,
		writePromise:Promise<any>,
		loadPromise:Promise<any>,
		savePromise:Promise<any>
	
	/**
	 * Load the new settings
	 *
	 * @returns {{eTags: {}, resourcesQueriedAt: {}}}
	 */
	async function load() {
	
		log.info(`Check for status file ${syncStatusFilename}`)
		if (writePromise)
			await writePromise
		
		const
			newStatus = {
				eTags: {},
				timestamps: {}
			} as IGithubSyncStatus
		
		try {
			if (fs.existsSync(syncStatusFilename)) {
				const
					jsonStr = await Promise.fromCallback(callback => fs.readFile(syncStatusFilename, callback)),
					loadedStatus = parseJSON(jsonStr)
				
				log.info(`Loaded status`,loadedStatus)
				_.assign(newStatus, loadedStatus)
				
				
			}
		} catch (err) {
			log.error(`Failed to load sync status file - starting over`, err)
		}
		
		log.info(`Setting sync status`,newStatus)
		
		status = newStatus
	
		
	}
	
	async function save() {
		if (savePromise && !savePromise.isResolved())
			await savePromise
		
		const
			deferred = Promise.defer()
		
		try {
			
			//noinspection JSUnusedAssignment
			savePromise = deferred.promise
			
			const
				syncStatusJson = toJSON(status)
			
			await Promise.fromCallback(callback => fs.writeFile(syncStatusFilename,syncStatusJson,callback))
				
		} catch (err) {
			log.error(`Failed to write sync status to ${syncStatusFilename}`,err)
		} finally {
			deferred.resolve()
			savePromise = null
		}
	}
	
	
	loadPromise = load()
	
	/**
	 * Check to ensure status is loaded
	 */
	function checkLoaded() {
		assert(status,`Can not update or read sync status before loaded`)
	}
	
	
	/**
	 * Wait until status is loaded and ready
	 */
	export async function awaitLoaded() {
		if (loadPromise.isResolved())
			return
		
		await loadPromise
	}
	
	export function clearPrefix(prefix:string) {
		for (let map of [status.eTags,status.timestamps]) {
			Object
				.keys(map)
				.filter(key => key.startsWith(prefix))
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
	 * @returns {{}|{since: string}}
	 */
	export function getSinceTimestampParams(url:string) {
		const
			timestamp = getTimestamp(url)
		
		return !timestamp ? {} : {
			since: moment(timestamp).format()
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
	export function setMostRecentTimestamp(url:string,models:any[],...props:string[]) {
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
export const {
	awaitLoaded,
	clearPrefix,
	getTimestamp,
	setTimestamp,
	getETag,
	setETag
} = GithubSyncStatus



export default GithubSyncStatus