import {ObservableStore} from 'typedux'
import {BaseService, IServiceConstructor, RegisterService} from 'shared/services'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {issueModelsSelector} from 'shared/actions/data/DataSelectors'

import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {enabledReposSelector,enabledRepoIdsSelector} from 'shared/actions/repo/RepoSelectors'

import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'
import ValueCache from 'shared/util/ValueCache'
import {ProcessType} from "shared/ProcessType"
import {DatabaseClientService} from "shared/services/DatabaseClientService"

const log = getLogger(__filename)

@RegisterService(ProcessType.Server)
export class RepoStateService extends BaseService {

	private unsubscribe:Function

	store:ObservableStore<any>
	repoActions:RepoActionFactory
	issueActions:IssueActionFactory
	
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
		this.repoActions = Container.get(RepoActionFactory)
		this.issueActions = Container.get(IssueActionFactory)
		return super.init()
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
			enabledReposSelector,
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
			module.hot.dispose(() => this.clean())
		}

		//
		// this.store.observe(
		// 	[this.repoActions.leaf(),'selectedIssues'],
		// 	this.selectedIssuesChanged
		// )


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


	selectedIssueIdsValue = new ValueCache((selectedIssueIds:number[]) => {
		if (selectedIssueIds && selectedIssueIds.length === 1)
			this.issueActions.loadActivityForIssue(selectedIssueIds[0])
	})
	/**
	 * When selected issues change - update the activity
	 */
	selectedIssueIdsChanged = _.debounce((selectedIssueIds) => {
		this.selectedIssueIdsValue.set(selectedIssueIds)
	},250)

	/**
	 * When enabled repos change,
	 * load supporting data/models
	 *
	 * @param availableRepos
	 */
	enabledReposChanged = async () => {
		const enabledRepoIds = enabledRepoIdsSelector(this.store.getState())
		const issueModels = issueModelsSelector(this.store.getState())
		const selectedIssueIds = selectedIssueIdsSelector(this.store.getState())
		let newSelectedIssueIds = await selectedIssueIds
			.filter((issueId) => {
				let issue = issueModels.get(`${issueId}`)

				const issueExists = !_.isNil(issue)
				const repoIdEnabled = issueExists && enabledRepoIds.includes(issue.repoId)
				log.info('Selected issue id filter',issueExists,repoIdEnabled)
				return issueExists && repoIdEnabled
			})

		if (!_.isEqual(selectedIssueIds,newSelectedIssueIds))
			this.issueActions.setSelectedIssueIds(newSelectedIssueIds)
		this.issueActions.loadIssues()
	}
}

export default RepoStateService