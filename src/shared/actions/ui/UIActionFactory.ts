import {AutoWired,Inject, Container} from 'typescript-ioc'
import {ActionFactory,Action,ActionMessage} from 'typedux'

import {UIKey} from "shared/Constants"
import {IToastMessage} from 'shared/models/Toast'
import {UIState} from 'shared/actions/ui/UIState'


@AutoWired
export class UIActionFactory extends ActionFactory<any,ActionMessage<UIState>> {

	constructor() {
		super(UIState)
	}

	leaf():string {
		return UIKey;
	}

	@Action()
	setTheme(theme:any) {}


	@Action()
	setError(err:Error) {}

	@Action()
	setSelectedIssueIds(selectedIssueIds:number[]) {}

	@Action()
	addMessage(message:IToastMessage) {}

	@Action()
	addErrorMessage(err:Error|string) {}

	@Action()
	removeMessage(id:string) {}



	@Action()
	clearMessages() {}


	@Action()
	setDialogOpen(name:string,open:boolean) {}





}

export default UIActionFactory