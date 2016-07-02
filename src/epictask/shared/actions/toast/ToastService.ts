
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


const pendingTimers = {}

export async function start() {

	if (!Env.isRenderer) {
		const {getStore} = require('shared/store')

		const store = getStore()
		store.observe([appActions.leaf(), 'messages'], (newMessages) => {
			newMessages = newMessages.toJS()

			newMessages.forEach(msg => {

				if (pendingTimers[msg.id])
					return

				pendingTimers[msg.id] = setTimeout(() => {
					appActions.removeMessage(msg.id)
				}, 5000)
			})
		})
	}

}