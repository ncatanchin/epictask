
import {AppStateType} from 'shared/AppStateType'
import {getStore} from 'app/store'
import {AppActionFactory as AppActionFactoryType} from 'app/actions/AppActionFactory'
import {AuthActionFactory as AuthActionFactoryType} from 'app/actions/auth/AuthActionFactory'
import {RepoActionFactory as RepoActionFactoryType} from 'app/actions/repo/RepoActionFactory'
import {Settings} from 'shared/Settings'
const electron = require('electron')

const log = getLogger(__filename)
const store = getStore()

let appActions:AppActionFactoryType
let authActions:AuthActionFactoryType
let repoActions:RepoActionFactoryType

let stateType = null


/**
 * Check for application state changes
 */
async function checkStateType() {

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

/**
 * Start the app state service
 */
export async function start() {
	const {AppActionFactory,AuthActionFactory,RepoActionFactory} = require('app/actions')

	appActions = new AppActionFactory() as AppActionFactoryType
	authActions = new AuthActionFactory() as AuthActionFactoryType
	repoActions = new RepoActionFactory() as RepoActionFactoryType

	electron.ipcRenderer.on('syncAllRepoDetails',(event,details) => {
		repoActions.syncAllRepoDetails()
	})

	store.observe([appActions.leaf(),'stateType'],() => {
		checkStateType()
	})

	// If the state type has not yet been set then set it
	if (!appActions.state.stateType) {
		const startingStateType = ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
		appActions.setStateType(startingStateType)
	}
}

