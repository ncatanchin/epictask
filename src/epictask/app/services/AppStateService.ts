import {AppStateType} from '../../shared'
import {getStore} from '../store'
import {AppActionFactory,} from '../actions'
import {AuthActionFactory} from '../actions/auth'
import {RepoActionFactory} from '../actions/repo'
import {Settings} from '../../shared/Settings'


const log = getLogger(__filename)
const store = getStore()
const appActions = new AppActionFactory()
const authActions = new AuthActionFactory()
const repoActions = new RepoActionFactory()

let stateType = null


async function updateStateType() {
	const newStateType = appActions.state.stateType
	if (!newStateType || stateType === newStateType)
		return

	log.info('New App State', newStateType, "Old App State",stateType)
	stateType = newStateType

	if (stateType === AppStateType.AuthVerify) {
		authActions.verify()
	} else if (stateType === AppStateType.Home) {
		await Promise.all([repoActions.getAvailableRepos(),repoActions.getRepos()])


		const repoId = Settings.repoId
		if (repoId) {
			log.info('Looking for previous repo id',repoId)
			for (let repo of repoActions.state.repos) {
				if (repo.id === repoId) {
					log.info('Previously opened: ',repoId,repo)
					repoActions.setRepo(repo)
					break
				}
			}
		}

		repoActions.syncRepos()

	}
}

updateStateType()

store.observe(appActions.leaf(),() => {
	updateStateType()
})
