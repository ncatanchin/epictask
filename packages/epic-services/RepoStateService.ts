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
export class RepoStateService extends BaseService {
	
	/**
	 * Unsubscribe from store
	 */
	private unsubscribe:Function

	private unsubscribers = []
	
	private store:ObservableStore<any>
	
	private pendingActivityLoad:CancelablePromiseResolver<any>
	
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
		removeDatabaseChangeListener(AvailableRepo,this.onDatabaseChanged)
		
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
	 * Tracks addition reloads required
	 *
	 * @type {boolean}
	 */
	private repoReloadPending = false
	
	/**
	 * Reload in progress
	 *
	 * @type {boolean}
	 */
	private repoLoading = false
	
	/**
	 * Initial deferred load
	 *
	 * @type {Promise.Resolver<T>}
	 */
	private reposLoadedDeferred = Promise.defer()
	
	/**
	 * Reload repos
	 */
	private reloadAvailableRepos = _.debounce(async () => {
		if (this.repoReloadPending && this.repoLoading) {
			return
		}
		
		if (this.repoLoading) {
			this.repoReloadPending = true
			return
		}
		
		log.debug(`Reloading available repos`)
		this.repoLoading = true
		await getRepoActions().loadAvailableRepos(true)
		
		const
			restart = this.repoReloadPending
		
		assign(this, {
			repoReloadPending: false,
			repoLoading: false
		})
		
		if (restart) {
			this.reloadAvailableRepos()
		}
		
		if (!this.reposLoadedDeferred.promise.isResolved())
			this.reposLoadedDeferred.resolve()
	})
	
	/**
	 * On Available repo change - reload databases
	 * @param changes
	 */
	private onDatabaseAvailableReposChanged(changes: IDatabaseChange[]) {
		
		const
			models = changes.map(it => it.model)
		
		log.debug(`Available repos changed, reloading repos`, models)
		
		this.reloadAvailableRepos()
	}
	
	
	
	/**
	 * When issues change in the database
	 *
	 * @param allChanges
	 */
	private onDatabaseChanged = (allChanges: IDatabaseChange[]) => {
		log.debug(`got database changes`,allChanges)
		const
			groups = _.groupBy(allChanges, it => it.type)
		
		Object
			.keys(groups)
			.forEach(type => {
				log.debug(`Change type ${type}`)
				if (type === AvailableRepo.$$clazz) {
					this.onDatabaseAvailableReposChanged(groups[type])
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
		
		
		
		this.reloadAvailableRepos()
		
		
		// WAIT FOR INITIAL LOAD TO COMPLETE
		await this.reposLoadedDeferred.promise
		//await getRepoActions().loadAvailableRepos(true)
		
		log.debug(`Watching DB changes`)
		addDatabaseChangeListener(AvailableRepo, this.onDatabaseChanged)
		
		
		// this.unsubscribe = this.store
		// 	.observe([IssueKey,'selectedIssueIds'],this.selectedIssueIdsChanged)
		
		
		
		// CONTINUE REMOVING ANY REPOS MARKED FOR DELETE
		this.finishPendingDeletes()
		
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
	
	
	// /**
	//  * Watches for changes to selected issue ids
	//  */
	// private selectedIssueIdsChanged = (selectedIssueIds:number[]) => {
	//
	// 	if (ProcessConfig.isType(ProcessType.JobServer))
	// 		return
	//
	// 	log.debug(`Selected issue ids updated`,selectedIssueIds)
	// 	if (selectedIssueIds && selectedIssueIds.length === 1) {
	//
	// 		log.debug(`Loading activity`)
	// 		const
	// 			{pendingActivityLoad} = this
	//
	// 		if (pendingActivityLoad)
	// 			pendingActivityLoad.cancel()
	//
	// 		this.pendingActivityLoad = getIssueActions().loadActivityForIssue(selectedIssueIds[0])
	// 	}
	// }
	
	
}

export default RepoStateService


acceptHot(module,log)