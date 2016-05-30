import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppStateType} from '../../shared'
import {AppKey} from "../../shared/Constants"
import {AppState} from './AppState'

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<any,ActionMessage<typeof AppState>> {

	constructor() {
		super(AppState)
	}

	leaf():string {
		return AppKey;
	}

	@Action()
	setTheme(theme:any) {}

	@Action()
	setStateType(stateType:AppStateType) {}

	@Action()
	setError(err:Error) {}


}
