import {Container} from 'typescript-ioc'
import {AppStateType} from 'epic-typedux'
import {LoginPage} from './LoginPage'
import {VerifyLoginPage} from './VerifyLoginPage'
import {HomePage} from './HomePage'
import { getAppActions } from "epic-typedux/provider"


export * from './Page'

const log = getLogger(__filename)


const Pages = {
	[AppStateType.AuthLogin]:  LoginPage,
	[AppStateType.AuthVerify]: VerifyLoginPage,
	[AppStateType.Home]: HomePage
}

export function getPage(stateType:AppStateType = null) {
	const
		appActions = getAppActions()
	
	stateType = stateType || appActions.state.stateType
	
	const
		page = Pages[stateType] || HomePage

	log.debug('Returning page for app state type', stateType,AppStateType[stateType])

	return page
}

export * from './WelcomePage'

export {
	LoginPage,
	VerifyLoginPage,
	HomePage
}