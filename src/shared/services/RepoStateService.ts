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


	async init():Promise<this> {
		this.store = Container.get(ObservableStore as any) as any
		
		return super.init()
	}

	async start():Promise<this> {
		await super.start()
		
		const
			repoActions = getRepoActions(),
			availableRepos = await repoActions.getAllAvailableRepoResources()
		
		let enabledReposValueCache = new ValueCache(_.debounce((enabledRepos) => {
			log.debug(`CHANGED: Enabled repo`,enabledRepos)
			getIssueActions().loadIssues()
		},150),true)
		
		this.unsubscribers.push(
			this.store.observe([RepoKey,'availableRepos'],(newValue) => {
				const
					enabledRepos = enabledAvailableReposSelector(getStoreState())
				
				log.debug(`Enabled repo`,enabledRepos)
				enabledReposValueCache.set(enabledRepos)
			}),
			this.store.observe([IssueKey,'selectedIssueIds'],this.selectedIssueIdsChanged)
		)
		
		
		log.debug(`Got all avail repo parts`,availableRepos.map(repo => repo.id).join(','))
		repoActions.updateAvailableRepos(availableRepos)
		
		//await Promise.delay(100)
		//getIssueActions().loadIssues()
		
		//repoActions.loadAvailableRepos()
		
		
		
		
		// Subscribe for changes
		// this.unsubscribe = this.store.getReduxStore().subscribe(() => {
		// 	//const state = this.store.getState()
		//
		// 	enabledRepoIdsValue.set(enabledRepoIdsSelector(state))
		// 	selectedIssueIdsValue.set(selectedIssueIdsSelector(state))
		// })
		
		
		
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
	},150)
	
	
	
	
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