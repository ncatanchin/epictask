import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {UIState} from 'shared/actions/ui/UIState'
import {UIKey} from 'shared/Constants'
import {Provided} from 'shared/util/ProxyProvided'

@Provided
export class UIReducer extends DefaultLeafReducer<UIState,ActionMessage<UIState>> {

	constructor() {
		super(UIKey,UIState)
	}


	defaultState(o = {}):UIState {
		return UIState.fromJS(o)
	}


	setTheme(state:UIState,theme:any) {
		return state.merge({theme})
	}
}