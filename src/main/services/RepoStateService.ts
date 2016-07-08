import {ObservableStore} from 'typedux'
import {List} from 'immutable'
import {Singleton, AutoWired, Inject,Container, Scope} from 'typescript-ioc'
import {IService, ServiceStatus, BaseService} from './IService'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

const log = getLogger(__filename)



@AutoWired
@Singleton
export default class RepoStateService extends BaseService {

	refMap:any = {}

	selectedIssuesChanged

	@Inject
	store:ObservableStore<any>

	@Inject
	repoActions:RepoActionFactory



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
		// await this.enabledReposChanged(this.repoActions.state.availableRepos,List())
		// this.selectedIssuesChanged(this.repoActions.state.selectedIssues)
		//
		// // Setup watches for both
		// this.store.observe(
		// 	[this.repoActions.leaf(),'availableRepos'],
		// 	this.enabledReposChanged
		// )
		//
		// this.store.observe(
		// 	[this.repoActions.leaf(),'selectedIssues'],
		// 	this.selectedIssuesChanged
		// )


		return this
	}


	destroy():this {
		return null
	}


	enabledReposChanged = async (newEnabledRepos,oldEnabledRepos) => {
		const {availableRepos} = this.repoActions.state

		// const enabledRepoIds = availableRepos
		// 	.filter(availRepo => availRepo.enabled)
		// 	.map(availRepo => availRepo.repoId)
		// 	.toArray()

		// if (_.isArrayEqualBy(enabledRepoIds,this.refMap.enabledRepoIds,'id'))
		// 	return

		//this.refMap.enabledRepoIds = enabledRepoIds
		this.repoActions.loadIssues()
	}
}
