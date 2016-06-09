import {AppStateType} from '../../shared/AppStateType'
import {getStore} from '../store'
import {AppActionFactory} from '../actions/AppActionFactory'
import {AuthActionFactory} from '../actions/auth/AuthActionFactory'
import {RepoActionFactory} from '../actions/repo/RepoActionFactory'


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
		repoActions.syncRepos()

	}
}


export async function start() {
	await updateStateType()

	store.observe(appActions.leaf(),() => {
		updateStateType()
	})
}

