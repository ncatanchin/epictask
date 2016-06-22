
import {AppStateType} from 'shared/AppStateType'
import {getStore} from 'shared/store'
import {AppActionFactory as AppActionFactoryType} from './AppActionFactory'
import {AuthActionFactory as AuthActionFactoryType} from './auth/AuthActionFactory'
import {RepoActionFactory as RepoActionFactoryType} from './repo/RepoActionFactory'
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
		repoActions.getRepos()
			.then(() => repoActions.getAvailableRepos())
			.then(() => repoActions.syncRepos())


	}
}

/**
 * Start the app state service
 */
export async function start() {
	const {AppActionFactory} = require('shared/actions/AppActionFactory')
	const {AuthActionFactory} = require('shared/actions/auth/AuthActionFactory')
	const {RepoActionFactory} = require('shared/actions/repo/RepoActionFactory')

	appActions = new AppActionFactory() as AppActionFactoryType
	authActions = new AuthActionFactory() as AuthActionFactoryType
	repoActions = new RepoActionFactory() as RepoActionFactoryType

	// electron.ipcRenderer.on('syncAllRepoDetails',(event,details) => {
	// 	repoActions.syncAllRepoDetails()
	// })

	store.observe([appActions.leaf(),'stateType'],() => {
		checkStateType()
	})

	// If the state type has not yet been set then set it
	if (!appActions.state.stateType) {
		const startingStateType = ((Settings.token) ? AppStateType.AuthVerify : AppStateType.AuthLogin)
		appActions.setStateType(startingStateType)
	}
}

if (module.hot) {
	module.hot.accept(['shared/actions/AppActionFactory','shared/actions/auth/AuthActionFactory','shared/actions/repo/RepoActionFactory'],updates => {
		electron.ipcRenderer.removeAllListeners('syncAllRepoDetails')
		start()
	})
}