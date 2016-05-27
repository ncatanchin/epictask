

import {LoginPage,VerifyLoginPage} from './auth'
import {HomePage} from './home'

import {AppActionFactory} from './AppActionFactory'

const appActions = new AppActionFactory()

const Pages = {
	[AppStateType.Login]: LoginPage,
	[AppStateType.VerifyLogin]: VerifyLoginPage,
	[AppStateType.Ready]: HomePage
}

export function getPage() {
	return Pages[appActions.state.stateType]

}