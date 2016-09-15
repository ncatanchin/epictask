import {ObservableStore} from 'typedux'
import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import ValueCache from 'shared/util/ValueCache'
import {ProcessType} from "shared/ProcessType"
import {DatabaseClientService} from "shared/services/DatabaseClientService"
import {enabledRepoIdsSelector} from "shared/actions/repo/RepoSelectors"
import { getIssueActions, getRepoActions } from "shared/actions/ActionFactoryProvider"
import { selectedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"

const log = getLogger(__filename)

@RegisterService(ProcessType.UI)
export class RepoStateService extends BaseService {

	private unsubscribe:Function

	store:ObservableStore<any>
	
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	
	
	private clean() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}
	}


	async init():Promise<this> {
		this.store = Container.get(ObservableStore as any) as any
		
		return super.init()
	}

	async start():Promise<this> {
		await super.start()
		
		const
			enabledRepoIdsValue = new ValueCache(this.enabledReposChanged),
			selectedIssueIdsValue = new ValueCache(this.selectedIssueIdsChanged)
		
		const repoActions = getRepoActions()
		repoActions.loadAvailableRepos()
		
		// Subscribe for changes
		this.unsubscribe = this.store.getReduxStore().subscribe(() => {
			const state = this.store.getState()
			
			enabledRepoIdsValue.set(enabledRepoIdsSelector(state))
			selectedIssueIdsValue.set(selectedIssueIdsSelector(state))
		})
		
		
		
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

	
	private selectedIssueIdsChanged = _.debounce((selectedIssueIds:number[]) => {
		if (selectedIssueIds && selectedIssueIds.size === 1) {
			getIssueActions().loadActivityForIssue(selectedIssueIds[0])
		}
	},150)
	
	
	
	/**
	 * When enabled repos change,
	 * load supporting data/models
	 */
	private enabledReposChanged = (newValue,oldValue) => {
		log.info(`Old repo ids`,oldValue, `New Repo Ids`,newValue)
		getIssueActions().loadIssues()
		
	}
}

export default RepoStateService

if (module.hot) {
	module.hot.accept(() => log.info('hot reload',__filename))
}