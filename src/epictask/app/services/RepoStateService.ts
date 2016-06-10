
import {getStore} from '../store/AppStore'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {Repos} from 'shared/DB'

const log = getLogger(__filename)
const store = getStore()
const repoActions = new RepoActionFactory()

const refMap:any = {}

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

export async function start() {
	enabledReposChanged()

	store.observe([repoActions.leaf(),'availableRepos'],() => enabledReposChanged())
	//store.observe([repoActions.leaf(),'selectedRepos'],() => selectedReposChanged())
}

