import { ObservableStore } from "typedux"
import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import { ProcessType } from "epic-global"
import { DatabaseClientService } from "./DatabaseClientService"
import { getRepoActions } from "epic-typedux"
import { getStores, addDatabaseChangeListener, removeDatabaseChangeListener } from "epic-database-client"
import { acceptHot } from "epic-global/HotUtils"
import { Repo, AvailableRepo } from "epic-models"

const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Manages data state changes and takes approriate action
 */
@RegisterService(ProcessType.UI)
export class GithubNotificationService extends BaseService {
	
	/**
	 * Unsubscribe fns
	 */
	private unsubscribers = []
	
	private store:ObservableStore<any>
	
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

	private async finishPendingDeletes() {
		try {
			const
				pendingRepos = (await getStores().availableRepo.findAll())
					.filter(availRepo => availRepo.deleted)
			
			log.debug(`Pending ${pendingRepos.size} repos to delete`)
			
			pendingRepos.forEach(pendingRepo =>
				getRepoActions().removeAvailableRepo(pendingRepo.id))
			
		} catch (err) {
			log.error(`Failed to remove pending deletes`,err)
		}
	}
	
	/**
	 * Init the store
	 *
	 * @returns {Promise<BaseService>}
	 */
	async init():Promise<this> {
		this.store = Container.get(ObservableStore as any) as any
		
		return super.init()
	}
	
	
	
	/**
	 * When issues change in the database
	 *
	 * @param allChanges
	 */
	private onDatabaseChanged = (allChanges: IDatabaseChange[]) => {
		// log.debug(`got database changes`,allChanges)
		// const
		// 	groups = _.groupBy(allChanges, it => it.type)
		//
		// Object
		// 	.keys(groups)
		// 	.forEach(type => {
		// 		log.debug(`Change type ${type}`)
		// 		if (type === AvailableRepo.$$clazz) {
		// 			this.onDatabaseAvailableReposChanged(groups[type])
		// 		}
		//
		// 	})
		//
	}
	
	/**
	 * On start load available repos
	 *
	 * @returns {UIModelWatcherService}
	 */
	async start():Promise<this> {
		await super.start()
		
		
		
		log.debug(`Watching DB changes`)
		//addDatabaseChangeListener(AvailableRepo, this.onDatabaseChanged)
		
		
		// this.unsubscribe = this.store
		// 	.observe([IssueKey,'selectedIssueIds'],this.selectedIssueIdsChanged)
		
		if (module.hot) {
			module.hot.dispose(() => this.clean())
		}

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

export default GithubNotificationService


acceptHot(module,log)