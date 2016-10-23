import {Container} from 'typescript-ioc'
import {AppStateType} from 'shared/AppStateType'
import {LoginPage} from './LoginPage'
import {VerifyLoginPage} from './VerifyLoginPage'
import {HomePage} from './HomePage'
import {AppActionFactory} from 'shared/actions/app/AppActionFactory'

export * from './Page'

const log = getLogger(__filename)


const Pages = {
	[AppStateType.AuthLogin]:  LoginPage,
	[AppStateType.AuthVerify]: VerifyLoginPage,
	[AppStateType.Home]: HomePage
}

export function getPage(stateType:AppStateType = null) {
	const
		appActions = Container.get(AppActionFactory)
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