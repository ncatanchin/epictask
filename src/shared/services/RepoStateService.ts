import {ObservableStore} from 'typedux'
import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import ValueCache from 'shared/util/ValueCache'
import {ProcessType} from "shared/ProcessType"
import {DatabaseClientService} from "shared/services/DatabaseClientService"
import { enabledRepoIdsSelector, enabledAvailableReposSelector } from "shared/actions/repo/RepoSelectors"
import { getIssueActions, getRepoActions } from  "shared/actions/ActionFactoryProvider"
import { selectedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import { RepoKey, IssueKey } from "shared/Constants"
import { getStoreState } from "shared/store"
import { getStores } from "shared/Stores"

const log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export class RepoStateService extends BaseService {

	private unsubscribe:Function

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
		
		getRepoActions().loadAvailableRepos(true)
		
		this.unsubscribe = this.store.observe([IssueKey,'selectedIssueIds'],this.selectedIssueIdsChanged)
		
		// CONTINUE REMOVING ANY REPOS MARKED FOR DELETE
		this.finishPendingDeletes()
		
		if (module.hot) {
			module.hot.dispose(() => this.clean())
		}

		return this
	}


	async stop():Promise<this> {
		this.clean()
		return super.stop()

	}

	destroy():this {
		this.clean()
		return this
	}
	
	
	/**
	 * Watches for changes to selected issue ids
	 */
	private selectedIssueIdsChanged = _.debounce((selectedIssueIds:number[]) => {
		log.debug(`Selected issue ids updated`,selectedIssueIds)
		if (selectedIssueIds && selectedIssueIds.length === 1) {
			log.debug(`Loading activity`)
			getIssueActions().loadActivityForIssue(selectedIssueIds[0])
		}
	},200)
	
	
	
	
	// /**
	//  * When enabled repos change,
	//  * load supporting data/models
	//  */
	// private checkEnabledRepos = _.debounce(() => {
	//
	// 	log.debug(`Old repo ids`,oldValue, `New Repo Ids`,newValue)
	// 	getIssueActions().loadIssues()
	//
	// },150)
}

export default RepoStateService

if (module.hot) {
	module.hot.accept(() => log.debug('hot reload',__filename))
}