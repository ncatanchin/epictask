import { BaseService, RegisterService } from "epic-services/internal"
import { DatabaseClientService } from "epic-services/DatabaseClientService"
import {
	getHot, setDataOnHotDispose, acceptHot, GithubSyncStatus as SyncStatus, NotificationsKey,
	SettingKeys, SettingsPath
} from "epic-global"
import { AvailableRepo, IssuesEvent, RepoEvent } from "epic-models"
import { getGithubSyncMonitor } from "./GithubSyncMonitor"
import { RepoSyncManager } from "./GithubSyncHandlers"
import { addDatabaseChangeListener } from "epic-database-client/DatabaseClient"
import { getStores } from "epic-database-client/Stores"
import { NotificationSync } from "./NotificationSync"


const
	log = getLogger(__filename),
	
	// Container to support hot reloading
	instanceContainer = getHot(module,'instanceContainer',{}) as {
		instance:GithubSyncService,
		hotInstance:GithubSyncService
	}

//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Job Service for managing all operations
 */
@RegisterService(ProcessType.JobServer)
export class GithubSyncService extends BaseService {
	
	static readonly ServiceName = "GithubSyncService"
	
	static getInstance() {
		if (!instanceContainer.instance)
			instanceContainer.instance = new GithubSyncService()
		
		return instanceContainer.instance
	}
	
	
	private killed = false
	
	/**
	 * Unsubscribe from store updates
	 */
	private unsubscribers:Function[] = []
	
	/**
	 * Service dependencies
	 *
	 * @returns {[DatabaseClientService]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	/**
	 * Create the service
	 */
	constructor() {
		super()
		
		assert(!instanceContainer.instance,`GithubSyncManager can only be instantiated once`)
	}
	
	private startNotificationPolling() {
		const
			lastTimestamp = SyncStatus.getTimestamp(NotificationsKey),
			eTag = SyncStatus.getETag(NotificationsKey)
		
		getGithubSyncMonitor().startNotificationPolling(eTag,lastTimestamp,{
			notificationsReceived: (eTag,...notifications:IGithubNotification[]) => {
				if (eTag && eTag.length && eTag !== "W/\"\"") {
					SyncStatus.setETag(NotificationsKey, eTag)
					SyncStatus.setMostRecentTimestamp(NotificationsKey, notifications, 'updated_at')
				}
				if (notifications.length) {
					log.debug(`Syncing ${notifications.length}, going to sync notifications`)
					this.syncNotifications(notifications)
				}
			},
			allNotificationsReceived:(eTag,...notifications:IGithubNotification[]) => {
				log.debug(`Got ${notifications.length}, going to sync notifications`)
				
				if (eTag && eTag.length && eTag !== "W/\"\"") {
					SyncStatus.setETag(NotificationsKey, eTag)
					SyncStatus.setMostRecentTimestamp(NotificationsKey, notifications, 'updated_at')
				}
				
			}
		})
	}
	
	private syncNotifications(notifications = null) {
		NotificationSync.execute(notifications)
	}
	
	/**
	 * Make sure we are monitoring the correct available repos
	 *
	 * @param availableRepos
	 */
	private onAvailableReposUpdated = _.debounce(async () => {
		const
			stores = getStores(),
			availableRepos = (await stores.availableRepo.findAll())
				.filter(it => !it.deleted)
		
		await Promise.all(
			availableRepos.map(
				async (availRepo) => availRepo.repo = await stores.repo.get(availRepo.id)
			))
		
		log.debug(`Received available repos`,availableRepos.map(availRepo => _.get(availRepo.repo,'full_name','no-name')).join(', '))
		
		const
			monitor = getGithubSyncMonitor(),
			currentRepoIds = monitor.getMonitoredRepoIds()
		
		log.info(`Checking for removed repos`)
		currentRepoIds
			.filter(repoId => !availableRepos.find(availRepo => availRepo.id === repoId))
			.forEach(repoId => {
				log.debug(`No longer monitoring repo ${repoId} - stopping monitor`)
				monitor.stopRepoMonitoring(repoId)
			})
		
		
		
		log.info(`Checking for new repos to monitor`)
		availableRepos
			.filter(availRepo => !currentRepoIds.includes(availRepo.id))
			.forEach(availRepo => {
				log.info(`Starting to monitor repo ${availRepo.repo.full_name}`)
				
				const
					repoResourceUrl = `${availRepo.id}-repo`,
					issuesResourceUrl = `${availRepo.id}-issues`
				
				let
					isFirstIssuesSync = !SyncStatus.getTimestamp(issuesResourceUrl),
					isFirstRepoSync = !SyncStatus.getTimestamp(repoResourceUrl)
				
				monitor.addRepoListener({
					id: availRepo.id,
					fullName: availRepo.repo.full_name,
					repoLastETag: SyncStatus.getETag(repoResourceUrl),
					repoLastTimestamp: SyncStatus.getTimestamp(repoResourceUrl),
					issuesLastETag: SyncStatus.getETag(issuesResourceUrl),
					issuesLastTimestamp: SyncStatus.getTimestamp(issuesResourceUrl)
				},{
					
					/**
					 * Repo event page notification
					 *
					 * @param eTag
					 * @param events
					 */
					repoEventsReceived: async (eTag:string,...events:RepoEvent<any>[]) => {
						await RepoSyncManager.get(availRepo).handleRepoEvents(availRepo,...events)
						if (isFirstRepoSync) {
							SyncStatus.setETag(repoResourceUrl, eTag)
							SyncStatus.setMostRecentTimestamp(repoResourceUrl, events, 'created_at')
						}
						
					},
					
					/**
					 * Repo event sync - after all completed
					 *
					 * @param eTag
					 * @param events
					 */
					allRepoEventsReceived: async (eTag:string,...events:RepoEvent<any>[]) => {
						isFirstRepoSync = false
						SyncStatus.setETag(repoResourceUrl,eTag)
						SyncStatus.setMostRecentTimestamp(repoResourceUrl, events, 'created_at')
						
						// TRIGGER SYNC - IF EVENTS RECEIVED
						if (events.length) {
							RepoSyncManager.get(availRepo).triggerRepoSync()
						}
					},
					
					/**
					 * IssuesEvent sync - page notification
					 * @param eTag
					 * @param events
					 */
					issuesEventsReceived: async (eTag:string,...events:IssuesEvent[]) => {
						await RepoSyncManager.get(availRepo).handleIssuesEvents(availRepo,...events)
						if (isFirstIssuesSync) {
							SyncStatus.setETag(issuesResourceUrl,eTag)
							SyncStatus.setMostRecentTimestamp(issuesResourceUrl, events, 'created_at')
						}
						
					},
					
					/**
					 * After all completed
					 *
					 * @param eTag
					 * @param events
					 */
					allIssuesEventsReceived: async (eTag:string,...events:IssuesEvent[]) => {
						isFirstIssuesSync = false
						
						
						
						SyncStatus.setETag(issuesResourceUrl,eTag)
						SyncStatus.setMostRecentTimestamp(issuesResourceUrl, events, 'created_at')
						
						// TRIGGER SYNC - IF EVENTS RECEIVED
						if (events.length) {
							RepoSyncManager.get(availRepo).triggerRepoSync()
						}
					}
					
				})
			})
	},1000)
	
	
	
	/**
	 * Start the Job Service,
	 * load all schedules, etc, etc
	 *
	 * @returns {JobManagerService}
	 */
	async start():Promise<this> {
		
		log.debug(`Waiting for github sync status to load`)
		await SyncStatus.awaitLoaded()
		
		log.debug(`Sync status loaded, subscribing for repo updates from state`)
		
		addDatabaseChangeListener(AvailableRepo,this.onAvailableReposUpdated)
		
		// SUBSCRIBE FOR TOKEN CHANGES
		this.unsubscribers.push(
			getStore().observe(
				[...SettingsPath,'token'],
				(newToken) => newToken && this.syncNotifications()
			))
		this.startNotificationPolling()
		this.onAvailableReposUpdated()
		this.syncNotifications()
		
		
		// Watch for job updates
		log.debug('Subscribe for state updates')
		return super.start()
	}
	
	
	stop():Promise<this> {
		this.kill()
		
		return super.stop()
	}
	
	kill() {
		//assert(module.hot,'kill can only be called for hmr')
		this.killed = true
		
		this.unsubscribers.forEach(it => it && it())

	}
	
	
}



/**
 * Get the GithubMonitorService singleton
 *
 * @return {GithubSyncService}
 */
export const getGithubSyncService = getHot(module,'getGithubSyncService',new Proxy(function(){},{
	apply: function(target,thisArg,args) {
		return GithubSyncService.getInstance()
	}
})) as () => GithubSyncService



// BIND TO PROVIDER
Container.bind(GithubSyncService).provider({get: getGithubSyncService})

export default getGithubSyncService

// HMR - SETUP
if (instanceContainer.instance) {
	// TODO: HMR / Do state update stuff here
	log.info(`Reloaded from HMR`)
}
setDataOnHotDispose(module,() => ({
	// Tack on a ref to the hot instance so we know it's there
	instanceContainer:assign(instanceContainer,{
		hotInstance: instanceContainer.instance
	}),
	getGithubSyncService
}))
acceptHot(module,log)

