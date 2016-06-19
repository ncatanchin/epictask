
import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import * as uuid from 'node-uuid'

const appActions = new AppActionFactory()

/**
 * Report message to ui from anywhere
 *
 * @param message
 * @param type
 */
export function addMessage(message:IToastMessage|string,type:ToastMessageType = ToastMessageType.Info) {
	if (_.isString(message)) {
		message = {
			id:uuid.v4(),
			createdAt: Date.now(),
			type: type,
			content: message
		}
	}

	appActions.addMessage(message)
}


/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function addErrorMessage(err:Error) {
	appActions.addErrorMessage(err)
}


