const log = getLogger(__filename)

import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {absoluteFilename} from 'shared/util/Files'
import * as uuid from 'node-uuid'

const fs = require('fs')
const path = require('path')

const appActions = new AppActionFactory()
const pendingTimers = {}
//const notifier = require('node-notifier')
//const notificationEvents = ['click','timeout']
//const messageNotifications = {}
//let iconContent = null, iconPath = null

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
export function addErrorMessage(err:Error|string) {
	if (_.isString(err)) {
		err = new Error(err)
	}
	const payload = _.pick(err,'message','code','stack','description') as any
	//logError(err)
	appActions.addErrorMessage(payload)
}



/**
 * Triggered when messages change
 *
 * @param newMessages
 */
function onMessagesChanged(newMessages) {

	_.toJS(newMessages).forEach(msg => {

		const clearMessage = () => appActions.removeMessage(msg.id)

		// Dont add a remove timer for Error messages
		if (msg.type === ToastMessageType.Error)
			return

		if (pendingTimers[msg.id]) {
			log.debug(`Timer already exists for message: ${msg.id}`)
			return
		}

		// Add the remove timer
		pendingTimers[msg.id] = setTimeout(clearMessage, 5000)
	})
}

/**
 * Service start interface
 */
export async function start() {

	if (!Env.isRenderer) {
		const {getStore} = require('shared/store')

		const store = getStore()
		store.observe([appActions.leaf(), 'messages'], onMessagesChanged)
	}
}

if (module.hot) {
	module.hot.dispose(() => {
		log.info(`HMR - disposing toast timers/messages`)
		Object.keys(pendingTimers)
			.forEach(msgId => {
				clearTimeout(pendingTimers[msgId])
				delete pendingTimers[msgId]

				appActions.clearMessages()
			})
	})
}