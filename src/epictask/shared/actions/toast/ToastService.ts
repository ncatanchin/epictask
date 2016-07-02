const log = getLogger(__filename)

import {ToastMessageType, IToastMessage} from 'shared/models/Toast'
import {AppActionFactory} from 'shared/actions/AppActionFactory'
import {absoluteFilename} from 'shared/util/Files'
import * as uuid from 'node-uuid'

const fs = require('fs')
const path = require('path')
const notifier = require('node-notifier')

const notificationEvents = ['click','timeout']
const appActions = new AppActionFactory()
const pendingTimers = {}
const messageNotifications = {}


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


let iconContent = null, iconPath = null
/**
 * Triggered when messages change
 *
 * @param newMessages
 */
function onMessagesChanged(newMessages) {

	Object.keys(messageNotifications)
		.forEach(msgId => {
			if (newMessages.find(msg => msg.id === msgId)) {
				log.debug('Message still exists, return')
				return
			}

			const notification = messageNotifications[msgId]
			delete messageNotifications[msgId]

		})

	_.toJS(newMessages).forEach(msg => {
		if (!iconContent) {
			iconPath = path.relative(process.cwd(),absoluteFilename(require('assets/images/epictask-logo-rainbow-square.png')))
			iconContent = fs.readFileSync(iconPath)
		}

		const clearMessage = () => appActions.removeMessage(msg.id)

		if (!messageNotifications[msg.id]) {
			const buttons = msg.type === ToastMessageType.Error ?
				['Acknowledge'] : []

			const notification =
				notifier.notify({
					title: 'epictask',
					message: msg.content,
					icon: iconPath,
					buttons
				})

			// Add Notification events
			notificationEvents.forEach(event => notification.on(event,clearMessage))

			messageNotifications[msg.id] = notification
		}

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