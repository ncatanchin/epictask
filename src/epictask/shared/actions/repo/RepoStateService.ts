import {ObservableStore} from 'typedux'
import {RepoActionFactory} from './RepoActionFactory'
import {Repos} from 'main/db/DB'

const log = getLogger(__filename)
let store:ObservableStore<any>
let repoActions:RepoActionFactory

const refMap:any = {}
let selectedIssuesChanged

async function enabledReposChanged() {
	const {availableRepos} = repoActions.state

	const enabledRepoIds = availableRepos
		.filter(availRepo => availRepo.enabled)
		.map(availRepo => availRepo.repoId)

	if (_.isArrayEqualBy(enabledRepoIds,refMap.enabledRepoIds,'id'))
		return

	refMap.enabledRepoIds = enabledRepoIds
	repoActions.loadIssues()
}



/**
 * Start the repo state service
 */
export async function start() {
	const {RepoActionFactory} = require('shared/actions/repo/RepoActionFactory')
	const {getStore} = require('shared/store')
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
	module.hot.accept(['shared/actions/repo/RepoActionFactory','shared/store'],(updates) => {
		log.info(`HMR received updates repo actions and store`, updates, 'restarting')
		start()
	})
}
