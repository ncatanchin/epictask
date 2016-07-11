import {DefaultLeafReducer,ActionMessage} from 'typedux'
import * as uuid from 'node-uuid'
import {UIState} from 'shared/actions/ui/UIState'
import {IToastMessage, ToastMessageType} from 'shared/models/Toast'
import {List} from 'immutable'
import {UIKey} from 'shared/Constants'


export function makeToastMessage(opts:any) {
	return Object.assign({},opts,{
		id:uuid.v4(),
		createdAt:Date.now(),
		content: opts.content || 'No content provided - DANGER will robinson'
	})
}

export class UIReducer extends DefaultLeafReducer<UIState,ActionMessage<UIState>> {

	constructor() {
		super(UIKey,UIState)
	}


	defaultState():UIState {
		return new UIState()
	}

	setSelectedIssueIds(state:UIState,selectedIssueIds:number[]) {
		return state.set('selectedIssueIds',selectedIssueIds)
	}

	setDialogOpen(state:UIState,name:string,open:boolean) {
		return state.set(
			'dialogs',
			state.dialogs.set(name,open)
		)
	}

	setTheme(state:UIState,theme:any) {
		return state.merge({theme})
	}

	addMessage(state:UIState,message:IToastMessage) {

		return state.messages
			.findIndex(item => _.toJS(item).id === message.id) > -1 ?
				state :
				state.update('messages',messages => {
					messages = messages.push(message)
					if (messages.size > 5)
						messages = messages.splice(0,messages.size - 5)

					return messages
				})
	}

	addErrorMessage(state:UIState,err:Error|string) {
		err = ((_.isString(err)) ? new Error(err) : err) as Error
		const message = makeToastMessage({
			type: ToastMessageType.Error,
			content: err.message || err.toString(),
			stack: err.stack
		})
		return this.addMessage(state,message)
	}

	removeMessage(state:UIState,id:string) {
		return state.set(
			'messages',
			state.messages.filter(msg => _.toJS(msg).id !== id)
		)
	}

	clearMessages(state:UIState) {
		return state.set('messages',List())
	}



	setError(state:UIState,err:Error) {
		return this.addErrorMessage(state,err)
	}

}