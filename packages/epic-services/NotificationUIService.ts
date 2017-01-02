import {List} from 'immutable'
import { ObservableStore } from "typedux"
import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import { ProcessType, addHotDisposeHandler } from "epic-global"
import { DatabaseClientService } from "./DatabaseClientService"
import { getRepoActions } from "epic-typedux"
import { getStores, addDatabaseChangeListener, removeDatabaseChangeListener } from "epic-database-client"
import { acceptHot } from "epic-global/HotUtils"
import { Repo, AvailableRepo, GithubNotification } from "epic-models"
import { getUIActions } from "epic-typedux/provider"

const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

let
	instance:NotificationUIService

/**
 * Manages data state changes and takes approriate action
 */
@RegisterService(ProcessType.UI)
export class NotificationUIService extends BaseService {
	
	/**
	 * Unsubscribe fns
	 */
	private unsubscribers = []
	
	constructor() {
		super()
		
		instance = this
	}
	
	
	private async loadGithubNotifications() {
		await getUIActions().loadNotifications()
	}
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	
	
	/**
	 * Clean the repo state listeners
	 */
	private clean() {
		//removeDatabaseChangeListener(AvailableRepo,this.onDatabaseChanged)
		
		this.unsubscribers.forEach(it => it())
		this.unsubscribers.length = 0
	}

	
	/**
	 * Init the store
	 *
	 * @returns {Promise<BaseService>}
	 */
	async init():Promise<this> {
		return super.init()
	}
	
	
	
	/**
	 * When issues change in the database
	 *
	 * @param allChanges
	 */
	private onDatabaseChanged = (allChanges: IDatabaseChange[]) => {
		log.debug(`got database changes for Notifications`,allChanges)
		const
			groups = _.groupBy(allChanges, it => it.type)

		Object
			.keys(groups)
			.forEach(type => {
				log.debug(`Change type ${type}`)
				if (type === GithubNotification.$$clazz) {
					getUIActions().updateNotificationsInState(List(groups[type].map(it => it.model)))
				}

			})

	}
	
	/**
	 * On start load available repos
	 *
	 * @returns {UIModelWatcherService}
	 */
	async start():Promise<this> {
		await super.start()
		
		log.debug(`Watching DB changes for Notifications`)
		addDatabaseChangeListener(GithubNotification, this.onDatabaseChanged)
		
		log.debug('loading notifications')
		await this.loadGithubNotifications()
		
		
		
		
		addHotDisposeHandler(module,() => this.clean())
		
		return this
	}
	
	/**
	 * Stop the service
	 *
	 * @returns {Promise<BaseService>}
	 */
	async stop():Promise<this> {
		this.clean()
		return super.stop()

	}
	
	/**
	 * Destroy the service
	 *
	 * @returns {UIModelWatcherService}
	 */
	destroy():this {
		this.clean()
		return this
	}
	
}

export function getNotificationUIService() {
	return instance
}

export default NotificationUIService


acceptHot(module,log)