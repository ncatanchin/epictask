
import {AppStateType} from 'shared'
import {LoginPage} from './LoginPage'
import {VerifyLoginPage} from './VerifyLoginPage'
import {HomePage} from './HomePage'
import {AppActionFactory} from 'shared/actions'

export * from './Page'

const log = getLogger(__filename)
const appActions = new AppActionFactory()

const Pages = {
	[AppStateType.AuthLogin]:  LoginPage,
	[AppStateType.AuthVerify]: VerifyLoginPage
}

export function getPage(stateType:AppStateType = null) {
	stateType = stateType || appActions.state.stateType
	const page = Pages[stateType] || HomePage

	log.debug('Returning page for app state type', stateType,AppStateType[stateType])

	return page
}

export {
	LoginPage,
	VerifyLoginPage,
	HomePage
}