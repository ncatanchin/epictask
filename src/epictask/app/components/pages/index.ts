
import {AppStateType} from '../../../shared'
import {LoginPage} from './LoginPage'
import {VerifyLoginPage} from './VerifyLoginPage'
import {HomePage} from './HomePage'
import {AppActionFactory} from '../../actions/AppActionFactory'

const appActions = new AppActionFactory()

const Pages = {
	[AppStateType.AuthLogin]: LoginPage,
	[AppStateType.AuthVerify]: VerifyLoginPage,
	[AppStateType.Ready]: HomePage
}

export function getPage() {
	return Pages[appActions.state.stateType]
}

export {
	LoginPage,
	VerifyLoginPage,
	HomePage
}