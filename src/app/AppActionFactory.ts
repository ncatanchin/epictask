import {ActionFactory,Action,ActionMessage} from 'typedux'
import {AppKey} from "shared/Constants"
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
	setStateType(stateType:AppStateType) {}

	@Action()
	setError(err:Error) {}


}
