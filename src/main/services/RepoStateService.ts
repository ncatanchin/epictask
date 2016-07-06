import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject,Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus} from './IService'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

const log = getLogger(__filename)



@AutoWired
@Singleton
export default class RepoStateService implements IService {

	refMap:any = {}

	selectedIssuesChanged

	@Inject
	store:ObservableStore<any>

	@Inject
	repoActions:RepoActionFactory

	private _status = ServiceStatus.Created


	status():ServiceStatus {
		return this._status
	}

	async init():Promise<this> {
		return this
	}

	async start():Promise<this> {

		// Issue selected handler
		this.selectedIssuesChanged = _.debounce((selectedIssues) => {
			if (selectedIssues && selectedIssues.length === 1) {
				this.repoActions.loadIssue(selectedIssues[0])
			}
		},150)

		// Enable repo change handler and selection change
		await this.enabledReposChanged(this.repoActions.state.availableRepos,List())
		this.selectedIssuesChanged(this.repoActions.state.selectedIssues)

		// Setup watches for both
		this.store.observe(
			[this.repoActions.leaf(),'availableRepos'],
			this.enabledReposChanged
		)

		this.store.observe(
			[this.repoActions.leaf(),'selectedIssues'],
			this.selectedIssuesChanged
		)


		return this
	}

	async stop():Promise<this> {
		return this
	}

	destroy():this {
		return null
	}


	enabledReposChanged = async (newEnabledRepos,oldEnabledRepos) => {
		const {availableRepos} = this.repoActions.state

		const enabledRepoIds = availableRepos
			.filter(availRepo => availRepo.enabled)
			.map(availRepo => availRepo.repoId)

		if (_.isArrayEqualBy(enabledRepoIds,this.refMap.enabledRepoIds,'id'))
			return

		this.refMap.enabledRepoIds = enabledRepoIds
		this.repoActions.loadIssues()
	}
}
