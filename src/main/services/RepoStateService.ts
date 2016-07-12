import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject,Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus, BaseService} from './IService'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {enabledRepoSelector} from 'shared/actions/repo/RepoSelectors'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {DataActionFactory} from 'shared/actions/data/DataActionFactory'
import {Stores} from 'main/services/DBService'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'

const log = getLogger(__filename)



@AutoWired
@Singleton
export default class RepoStateService extends BaseService {

	private unsubscribe:Function

	selectedIssuesChanged

	@Inject
	store:ObservableStore<any>

	@Inject
	repoActions:RepoActionFactory

	@Inject
	issueActions:IssueActionFactory


	@Inject
	dataActions:DataActionFactory


	async init():Promise<this> {
		await super.init()
		return this
	}

	async start():Promise<this> {
		await super.start()
		// Issue selected handler
		// this.selectedIssuesChanged = _.debounce((selectedIssues) => {
		// 	if (selectedIssues && selectedIssues.size === 1) {
		// 		this.repoActions.loadIssue(selectedIssues.get(0))
		// 	}
		// },150)
		//
		// // Enable repo change handler and selection change

		await this.enabledReposChanged()
		// this.selectedIssuesChanged(this.repoActions.state.selectedIssues)
		//
		// // Setup watches for both

		const enabledReposChangedSelector = createDeepEqualSelector(
			enabledRepoSelector,
			this.enabledReposChanged
		)

		const selectedIssueIdsChangedSelector = createDeepEqualSelector(
			selectedIssueIdsSelector,
			this.selectedIssueIdsChanged
		)

		this.unsubscribe = this.store.getReduxStore().subscribe(() => {
			const state = this.store.getState()
			enabledReposChangedSelector(state)
			selectedIssueIdsChangedSelector(state)
		})

		if (module.hot) {
			module.hot.dispose(() => this.unsubscribe && this.unsubscribe())
		}

		//
		// this.store.observe(
		// 	[this.repoActions.leaf(),'selectedIssues'],
		// 	this.selectedIssuesChanged
		// )


		return this
	}


	async stop():Promise<this> {
		await super.stop()
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}

		return this
	}

	destroy():this {
		return this
	}


	selectedIssueIdsChanged = (selectedIssueIds:number[]) => {
		if (selectedIssueIds && selectedIssueIds.length === 1)
			this.issueActions.loadActivityForIssue(selectedIssueIds[0])
	}

	/**
	 * When enabled repos change,
	 * load supporting data/models
	 *
	 * @param availableRepos
	 */
	enabledReposChanged = async (availableRepos = null) => {
		if (!availableRepos)
			availableRepos =  await Container.get(Stores).availableRepo.findAll()

		const enabledRepoIds = availableRepos
			.map(availRepo => availRepo.repoId)


		this.issueActions.loadIssues(...enabledRepoIds)
	}
}
