
import {AppStateType} from '../../../shared'
import {LoginPage} from './LoginPage'
import {VerifyLoginPage} from './VerifyLoginPage'
import {HomePage} from './HomePage'
import {AppActionFactory} from '../../actions/AppActionFactory'

const appActions = new AppActionFactory()

const Pages = {
	[AppStateType.AuthLogin]:  LoginPage,
	[AppStateType.AuthVerify]: VerifyLoginPage
}

export function getPage(stateType:AppStateType = null) {
	stateType = stateType || appActions.state.stateType
	return Pages[stateType] || HomePage
}

export {
	LoginPage,
	VerifyLoginPage,
	HomePage
}