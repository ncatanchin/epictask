import {ObservableStore} from 'typedux'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {Repos} from 'shared/DB'

const log = getLogger(__filename)
let store:ObservableStore<any>
let repoActions:RepoActionFactory

const refMap:any = {}
let selectedIssuesChanged

async function enabledReposChanged() {
	const {availableRepos} = repoActions.state

	const enabledRepoIds = availableRepos
		.filter(availRepo => availRepo.enabled)
		.map(async (availRepo) => (availRepo.repo) ?
			availRepo.repo.id :
			await Repos.repo.get(Repos.repo.key(availRepo.repoId)))

	if (_.isArrayEqualBy(enabledRepoIds,refMap.enabledRepoIds,'id'))
		return

	refMap.enabledRepoIds = enabledRepoIds
	repoActions.loadIssues()
}



/**
 * Start the repo state service
 */
export async function start() {
	const {RepoActionFactory} = require('app/actions/repo/RepoActionFactory')
	const {getStore} = require('app/store')
	repoActions = new RepoActionFactory()
	store = getStore()

	// Issue selected handler
	selectedIssuesChanged = _.debounce((selectedIssues) => {
		if (selectedIssues && selectedIssues.length === 1) {
			repoActions.loadIssue(selectedIssues[0])
		}
	},150)

	// Enable repo change handler and selection change
	enabledReposChanged()
	selectedIssuesChanged(repoActions.state.selectedIssues)

	// Setup watches for both
	store.observe([repoActions.leaf(),'availableRepos'],enabledReposChanged)
	store.observe([repoActions.leaf(),'selectedIssues'],selectedIssuesChanged)

}

if (module.hot) {
	module.hot.accept(['app/actions/repo/RepoActionFactory','app/store'],(updates) => {
		log.info(`HMR received updates repo actions and store`, updates, 'restarting')
		start()
	})
}
