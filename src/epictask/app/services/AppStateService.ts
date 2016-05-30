import {AppStateType} from '../../shared'
import {getStore} from '../store'
import {AppActionFactory,} from '../actions'
import {AuthActionFactory} from '../actions/auth'
import {RepoActionFactory} from '../actions/repo'


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
	} else if (stateType === AppStateType.Ready) {
		repoActions.getRepos()
	}
}

updateStateType()

let observer = store.observe(appActions.leaf(),() => {
	updateStateType()
})
