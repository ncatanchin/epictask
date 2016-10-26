import * as assert from 'assert'
import { PagedArray,getHot, setDataOnHotDispose, acceptHot } from  "epic-global"

import {RepoEvent,IssuesEvent} from 'epic-models'
import { createClient, GithubError } from "epic-github"

import { isString, toNumber, isPromise } from  "epic-global"

const
	log = getLogger(__filename),
	DefaultPollIntervalMillis = 60000,
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:GithubEventMonitor,
		hotInstance:GithubEventMonitor
	}

// DEBUG ENABLE
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Receives either or both repo events and issue events
 */
export interface IGithubEventListener {
	repoEventsReceived?:(eTag:string,...events:RepoEvent<any>[]) => any
	issuesEventsReceived?:(eTag:string,...events:IssuesEvent[]) => any
	allRepoEventsReceived?:(eTag:string,...events:RepoEvent<any>[]) => any
	
	allIssuesEventsReceived?:(eTag:string,...events:IssuesEvent[]) => any
}


export interface IGithubRepoInfo {
	id:number
	fullName:string
	repoLastETag?:string
	repoLastTimestamp?:number
	issuesLastETag?:string
	issuesLastTimestamp?:number
}

interface IGithubEventPollConfig {
	eTag:string
	pollIntervalMillis:number
	pollTimer:number
	polledTimestamp?:number
	nextPollTimestamp?:number
	running:boolean
}

/**
 * Internal shape of repo config
 */
interface IGithubMonitorConfig {
	id:number
	fullName:string
	started:boolean
	repoConfig?:IGithubEventPollConfig
	issuesConfig?:IGithubEventPollConfig
	listeners:IGithubEventListener[]
}


enum GithubPollType {
	Issues = 1,
	Repo,
	Both
}

export type IGithubRepoMonitorConfigMap = {
	[repoId:number]:IGithubMonitorConfig
}

/**
 * Monitor github events on repos and issues
 */

export class GithubEventMonitor {
	
	/**
	 * Singleton accessor
	 */
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new GithubEventMonitor()
		
		return instanceContainer.instance
	}
	
	
	
	/**
	 * Killed flag
	 */
	private killed = false
	
	/**
	 * All configured repos
	 */
	private monitoredRepos:IGithubRepoMonitorConfigMap = {}
	
	/**
	 * Create a new monitor
	 */
	constructor() {
		//assert(!instanceContainer.instance,`GithubSyncManager can only be instantiated once`)
	}
	
	/**
	 * Get all current repo ids
	 *
	 * @returns {number[]}
	 */
	getMonitoredRepoIds() {
		return Object.keys(this.monitoredRepos).map(repoIdStr => parseInt(repoIdStr,10))
	}
	
	/**
	 * Execute a poll on issues
	 *
	 * @param config
	 */
	private pollIssues(config:IGithubMonitorConfig) {
		log.info(`Polling issues config: ${config.fullName}`)
		if (config.issuesConfig && config.issuesConfig.running) {
			log.warn(`Already polling issue events for repo ${config.fullName}`)
			return
		}
		
		const
			{issuesConfig} = config
			
		
		issuesConfig.running = true
		
		if (issuesConfig.pollTimer)
			clearTimeout(issuesConfig.pollTimer)
		
		// POLL REPO EVENTS
		const doIssuesPoll = async () => {
			
			const
				client = createClient()
			
			let
				newestTimestamp:number,
				firstPageReceived = false
			
			try {
				
				//noinspection RedundantConditionalExpressionJS
				const allEvents = await client.issuesEvents(config.fullName, {
					eTag: issuesConfig.eTag,
					reverse: !issuesConfig.eTag ? true : false,
					
					// CALLED AFTER EACH PAGE
					onDataCallback: async (pageNumber:number, totalPages:number, items:PagedArray<IssuesEvent>, headers:any) => {
						
						let
							listenersWantToContinue = true,
							eTag = headers.get( 'ETag' ),
							pollInterval = headers.get('X-Poll-Interval')
						
						// UPDATE THE ETAG & INTERVAL ONLY ON THE FIRST PAGE
						if (!firstPageReceived) {
							firstPageReceived = true
							log.debug(`On page ${pageNumber} we received eTag=${eTag} pollInterval=${pollInterval}s`)
							if (eTag)
								issuesConfig.eTag = eTag
							
							if (pollInterval)
								issuesConfig.pollIntervalMillis = pollInterval * 1000
						}
						
						// ITERATE LISTENERS & EMIT EVENTS
						for (let listener of config.listeners) {
							if (!listener.issuesEventsReceived)
								continue
							
							let
								result = listener.issuesEventsReceived(eTag, ...items)
							
							if (isPromise(result)) {
								result = await result
							}
							
							if (result === false) {
								listenersWantToContinue = false
							}
						}
						
						// config.listeners.forEach(listener => {
						// 	if (listener.issuesEventsReceived && listener.issuesEventsReceived(eTag, ...items) === false) {
						// 		listenersWantToContinue = false
						// 	}
						// })
						
						// CHECK IF WE SHOULD CONTINUE GETTING PAGES
						const
							firstItemTimestamp = items[0] && items[0].created_at.getTime(),
							lastItem = items[ items.length - 1 ],
							lastItemTimestamp = lastItem && lastItem.created_at.getTime(),
							shouldContinue =
								// NO LISTENER EXPLICITLY RETURNED FALSE
								(listenersWantToContinue === true) &&
								
								// ALL DATA IS NEWER THEN OUR LAST POLL
								(!issuesConfig.polledTimestamp || lastItemTimestamp > issuesConfig.polledTimestamp)
						
						// KEEP TRACK OF THE OLDEST TIMESTAMP
						
						if (!newestTimestamp || (firstItemTimestamp > newestTimestamp)) {
							newestTimestamp = lastItemTimestamp
							log.debug(`Set newest timestamp to newestTimestamp`)
						}
						
						log.debug(`Received issues events, page ${pageNumber} of ${totalPages}, based on timestamps - continuing=${shouldContinue}`)
						return shouldContinue
						
					}
				})
				
				// CALLBACK AFTER ALL EVENTS
				for (let listener of config.listeners) {
					if (!listener.allIssuesEventsReceived)
						continue
					
					let
						result = listener.allIssuesEventsReceived(issuesConfig.eTag,...allEvents)
					
					if (isPromise(result))
						await result
				}
				
				
				log.debug(`All issues events - count ${allEvents.length}`)
			} catch (err) {
				if (err && err.statusCode === 304) {
					log.debug(`Content has not been updated based on the previous eTag ${issuesConfig.eTag}`)
					return
				}
				
				log.error(`Failed to get issues events`,err)
			}
			
			if (newestTimestamp) {
				issuesConfig.polledTimestamp = newestTimestamp + 1
				log.debug(`Set last polled timestamp to ${issuesConfig.polledTimestamp}`)
			}
			
			
		}
		
		// Start the poll, add a finally handler to set running to false
		doIssuesPoll().finally(() => {
			issuesConfig.running = false
			
			const
				pollIntervalMillis = issuesConfig.pollIntervalMillis || DefaultPollIntervalMillis
			
			log.debug(`Scheduling next issues poll in ${pollIntervalMillis / 1000}s`)
			issuesConfig.pollTimer = setTimeout(() => this.pollIssues(config),pollIntervalMillis) as any
		})
	}
	
	/**
	 * Execute a poll on a repo
	 *
	 * @param config
	 */
	private pollRepo(config:IGithubMonitorConfig) {
		log.debug(`Polling repo config: ${config.fullName}`)
		if (this.killed) {
			return log.warn(`Can not poll, we have been killed`)
		}
		
		if (config.repoConfig && config.repoConfig.running) {
			log.warn(`Already polling repo events for repo ${config.fullName}`)
			return
		}
		
		const
			{repoConfig} = config
			
		
		repoConfig.running = true
		
		if (repoConfig.pollTimer)
			clearTimeout(repoConfig.pollTimer)
		
		// POLL REPO EVENTS
		const doRepoPoll = async () => {
			
			const
				client = createClient()
			
			let
				newestTimestamp:number,
				firstPageReceived = false
			
			try {
				//noinspection RedundantConditionalExpressionJS
				const allEvents = await client.repoEvents(config.fullName, {
					eTag: repoConfig.eTag,
					reverse: !repoConfig.eTag ? true : false,
					// CALLED AFTER EACH PAGE
					onDataCallback: async (pageNumber:number, totalPages:number, items:PagedArray<RepoEvent<any>>, headers:any) => {
						
						let
							listenersWantToContinue = true,
							eTag = headers.get( 'ETag' ),
							pollInterval = headers.get('X-Poll-Interval')
						
						// UPDATE THE ETAG & INTERVAL ONLY ON THE FIRST PAGE
						if (!firstPageReceived) {
							firstPageReceived = true
							log.debug(`On page ${pageNumber} we received eTag=${eTag} pollInterval=${pollInterval}s`)
							if (eTag)
								repoConfig.eTag = eTag
							
							if (pollInterval)
								repoConfig.pollIntervalMillis = pollInterval * 1000
						}
						
						// ITERATE LISTENERS & EMIT EVENTS
						for (let listener of config.listeners) {
							if (!listener.repoEventsReceived)
								continue
							
							let
								result = listener.repoEventsReceived(eTag, ...items)
							
							if (isPromise(result))
								result = await result
									
							if (result === false) {
								listenersWantToContinue = false
							}
						}
						
						
						// CHECK IF WE SHOULD CONTINUE GETTING PAGES
						const
							firstItemTimestamp = items[0] && items[0].created_at.getTime(),
							lastItem = items[ items.length - 1 ],
							lastItemTimestamp = lastItem && lastItem.created_at.getTime(),
							shouldContinue =
								// NO LISTENER EXPLICITLY RETURNED FALSE
								(listenersWantToContinue === true) &&
								
								// ALL DATA IS NEWER THEN OUR LAST POLL
								(!repoConfig.polledTimestamp || lastItemTimestamp > repoConfig.polledTimestamp)
						
						// KEEP TRACK OF THE OLDEST TIMESTAMP
						
						if (!newestTimestamp || (firstItemTimestamp > newestTimestamp)) {
							newestTimestamp = lastItemTimestamp
							log.debug(`Set oldest timestamp to ${newestTimestamp}`)
						}
						
						log.debug(`Received repo events, page ${pageNumber} of ${totalPages}, based on timestamps - continuing=${shouldContinue}`)
						return shouldContinue
						
					}
				})
				
				// CALLBACK AFTER ALL EVENTS
				for (let listener of config.listeners) {
					if (!listener.allRepoEventsReceived)
						continue
					
					let
						result = listener.allRepoEventsReceived(repoConfig.eTag,...allEvents)
					
					if (isPromise(result))
						await result
				}
				
				log.debug(`All repo events - count ${allEvents.length}`)
			} catch (err) {
				if (err && err.statusCode === 304) {
					log.debug(`Content has not been updated based on the previous eTag ${repoConfig.eTag}`)
					return
				}
				
				log.error(`Failed to get repo events`,err)
			}
			
			if (newestTimestamp) {
				repoConfig.polledTimestamp = newestTimestamp + 1
				log.debug(`Set last polled timestamp to ${repoConfig.polledTimestamp}`)
			}
		}
		
		// Start the poll, add a finally handler to set running to false
		doRepoPoll().finally(() => {
			repoConfig.running = false
			
			const
				pollIntervalMillis = repoConfig.pollIntervalMillis || DefaultPollIntervalMillis
			
			log.debug(`Scheduling next poll in ${pollIntervalMillis / 1000}s`)
			repoConfig.pollTimer = setTimeout(() => this.pollRepo(config),pollIntervalMillis) as any
		})
	}
	
	/**
	 * Override function to force polling now for all monitored repos
	 */
	forcePolling(...repoIds:number[]) {
		Object
			.keys(this.monitoredRepos)
			.map(toNumber)
			.filter(repoId => !repoIds.length || repoIds.includes(repoId))
			.forEach(repoId => {
				const
					config = this.monitoredRepos[repoId]
				
				this.pollRepo(config)
				this.pollIssues(config)
			})
	}
	
	/**
	 * Start a polling execution
	 *
	 * @param config
	 * @param pollType
	 */
	private startPolling(config:IGithubMonitorConfig,pollType:GithubPollType) {
		if (config.started) {
			log.warn(`A repo can config can only be started once`,config)
			return
		}
		config.started = true
		
		this.pollIssues(config)
		this.pollRepo(config)
		
	}
	
	
	/**
	 * Add repo listener
	 *
	 * @param repo
	 * @param listener
	 */
	addRepoListener(repo:IGithubRepoInfo,listener:IGithubEventListener) {
		assert(repo && listener && !this.killed,`Both a repoId and a listener must be provided to enabled listening - and we can't be killed`)
		
		const
			repoConfig = this.monitoredRepos[repo.id] || (this.monitoredRepos[repo.id] = {
					id:repo.id,
					fullName:repo.fullName,
					listeners: [],
					started:false,
					repoConfig: {
						eTag: repo.repoLastETag,
						pollIntervalMillis: 60000,
						pollTimer:null,
						polledTimestamp: repo.repoLastTimestamp,
						running: false
					},
					issuesConfig: {
						eTag: repo.issuesLastETag,
						pollIntervalMillis: 60000,
						pollTimer:null,
						polledTimestamp: repo.issuesLastTimestamp,
						running: false
					}
				})
		
		assert(!repoConfig.listeners.includes(listener), 'You can add a listener twice')
		
		repoConfig.listeners.push(listener)
		
		if (!repoConfig.started) {
			this.startPolling(repoConfig, GithubPollType.Both)
		}
		
		return () => {
			const
				{listeners} = repoConfig,
				index = listeners.indexOf(listener)
			
			if (index > -1) {
					listeners.splice(index,1)
			}
			
			if (!listeners.length) {
				log.info(`Last listener removed from repo ${repoConfig.fullName} - killing monitor`)
				this.stopRepoMonitoring(repoConfig.id)
			}
			
			
		}
		
	}
	
	
	
	
	/**
	 * Stop monitoring a repo
	 *
	 * @param repoId
	 */
	stopRepoMonitoring = (repoId:number|string) => {
		if (isString(repoId))
			repoId = parseInt(repoId,10)

		const
			config = this.monitoredRepos[repoId]
		
		for (let configProp of ['repoConfig','issuesConfig']) {
			const
				poller = config['configProp']
			
			if (poller && poller.pollTimer) {
				clearTimeout(poller.pollTimer)
				poller.pollTimer = null
			}
		}
		
		delete this.monitoredRepos[repoId]
			
	}
	
	kill() {
		if (this.killed) {
			return log.warn(`We already were killed`)
		}
		
		log.info(`Stopping github event monitor`)
		
		this.killed = true
		
		Object
			.keys(this.monitoredRepos)
			.forEach(this.stopRepoMonitoring)
		
	}
	
	
}




/**
 * Get the GithubEventMonitorService singleton
 *
 * @return {getGithubEventMonitor}
 */
export const getGithubEventMonitor = getHot(module,'getGithubEventMonitor',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return GithubEventMonitor.getInstance()
	}
})) as () => GithubEventMonitor



// BIND TO PROVIDER
Container.bind(GithubEventMonitor).provider({get: getGithubEventMonitor})

export default getGithubEventMonitor

if (DEBUG)
	_.assignGlobal({
		getGithubEventMonitor
	})


// HMR - SETUP
if (instanceContainer.hotInstance) {
	log.info(`Reloaded from HMR, we simply replace the prototype and force an update here`)
	
	const
		fromInstance = instanceContainer.hotInstance,
		fromProto = fromInstance && Object.getPrototypeOf(fromInstance)
	
	let
		newProto
	
	if (fromInstance) {
		Object.setPrototypeOf(fromInstance,GithubEventMonitor.prototype)
		newProto = Object.getPrototypeOf(fromInstance)
		fromInstance.forcePolling()
	}
	
	log.debug(`hot reloading`,fromInstance,fromProto,newProto,'Are protos equal?',newProto === fromProto)
}
setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getGithubEventMonitor
}))
acceptHot(module,log)

