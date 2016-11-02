import { ObservableStore } from "typedux"
import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import { ProcessType, IssueKey } from "epic-global"
import { DatabaseClientService } from "./DatabaseClientService"
import { getIssueActions, getRepoActions } from "epic-typedux"
import { getStores } from "epic-database-client"
import { acceptHot } from "epic-global/HotUtils"
import {
	IDatabaseChange, TDatabaseChangeListener, getDatabaseClient,
	addDatabaseChangeListener
} from "epic-database-client/DatabaseClient"
import { Issue,User ,Milestone,Label ,AvailableRepo,Comment ,Repo } from "epic-models"
import { IModelConstructor } from "epic-global/Registry"

const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Manages data state changes and takes approriate action
 */
@RegisterService(ProcessType.UI,ProcessType.JobServer)
export class RepoStateService extends BaseService {
	
	/**
	 * Unsubscribe from store
	 */
	private unsubscribe:Function

	private unsubscribers = []
	
	private store:ObservableStore<any>
	
	private pendingActivityLoad:CancelablePromiseResolver
	
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
			log.error(`Failed to remove pending deletes`)
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
	 * On start load available repos
	 *
	 * @returns {RepoStateService}
	 */
	async start():Promise<this> {
		await super.start()
		
		// ADD DB CHANGE LISTENERS FIRST
		this.listeners.forEach((listener,clazz) => {
			addDatabaseChangeListener(clazz,listener)
		})
		
		getRepoActions().loadAvailableRepos(true)
		
		this.unsubscribe = this.store
			.observe([IssueKey,'selectedIssueIds'],this.selectedIssueIdsChanged)
		
		
		
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
	 * @returns {RepoStateService}
	 */
	destroy():this {
		this.clean()
		return this
	}
	
	
	/**
	 * Watches for changes to selected issue ids
	 */
	private selectedIssueIdsChanged = (selectedIssueIds:number[]) => {
		
		if (ProcessConfig.isType(ProcessType.JobServer))
			return
		
		log.debug(`Selected issue ids updated`,selectedIssueIds)
		if (selectedIssueIds && selectedIssueIds.length === 1) {
			
			log.debug(`Loading activity`)
			const
				{pendingActivityLoad} = this
			
			if (pendingActivityLoad)
				pendingActivityLoad.cancel()
			
			this.pendingActivityLoad = getIssueActions().loadActivityForIssue(selectedIssueIds[0])
		}
	}
	
	
	private onRepoChange = (change:IDatabaseChange) => {
		log.debug(`on repo change`,change)
	}
	
	private onLabelChange = (change:IDatabaseChange) => {
		log.debug(`on label change`,change)
	}
	
	private onAvailRepoChange = (change:IDatabaseChange) => {
		log.debug(`on avail repo change`,change)
	}
	
	private onMilestoneChange = (change:IDatabaseChange) => {
		log.debug(`on milestone change`,change)
	}
	
	private onUserChange = (change:IDatabaseChange) => {
		log.debug(`on user change`,change)
	}
	
	private onCommentChange = (change:IDatabaseChange) => {
		log.debug(`on comment change`,change)
	}
	
	private onIssueChange = (change:IDatabaseChange) => {
		log.debug(`on issue change`,change)
	}
	
	private listeners = M<IModelConstructor<any>,TDatabaseChangeListener>({
		[Repo.$$clazz]: this.onRepoChange,
		[AvailableRepo.$$clazz]: this.onAvailRepoChange,
		[Label.$$clazz]: this.onLabelChange,
		[Milestone.$$clazz]: this.onMilestoneChange,
		[Comment.$$clazz]: this.onCommentChange,
		[Issue.$$clazz]: this.onIssueChange,
		[User.$$clazz]: this.onUserChange
		
	})
}

export default RepoStateService


acceptHot(module,log)