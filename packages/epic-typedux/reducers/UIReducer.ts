import {DefaultLeafReducer,ActionMessage} from 'typedux'
import {UIState} from "../state/UIState"
import {UIKey} from "epic-global"
import {Provided} from  "epic-global"

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