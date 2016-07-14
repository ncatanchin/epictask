import {DefaultLeafReducer,ActionMessage} from 'typedux'
import * as uuid from 'node-uuid'
import {UIState} from 'shared/actions/ui/UIState'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'

import {UIKey} from 'shared/Constants'

export class UIReducer extends DefaultLeafReducer<UIState,ActionMessage<UIState>> {

	constructor() {
		super(UIKey,UIState)
	}


	defaultState():UIState {
		return new UIState()
	}


	setTheme(state:UIState,theme:any) {
		return state.merge({theme})
	}








}