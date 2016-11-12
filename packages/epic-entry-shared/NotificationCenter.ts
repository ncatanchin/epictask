import * as uuid from 'node-uuid'
import { isString } from  "typeguard"
import {Container} from 'typescript-ioc'
import { INotificationMessage, NotificationMessageType } from "epic-global/NotificationCenterClient"


/**
 * NotificationCenter functions for use globally
 */
export class NotificationCenter {
	
	get uiActions() {
		return require("epic-typedux/provider").getUIActions()
	}
	
	addMessage(message:INotificationMessage|string,type:NotificationMessageType = NotificationMessageType.Info) {
		if (_.isString(message)) {
			message = {
				id: uuid.v4(),
				createdAt: Date.now(),
				type: type,
				content: message,
				floatVisible: true
			}
		} else {
			message.type = type
		}
		this.uiActions.addMessage(message)
	}
	
	addDebugMessage(message:INotificationMessage|string) {
		this.addMessage(message,NotificationMessageType.Debug)
	}
	
	addInfoMessage(message:INotificationMessage|string) {
		this.addMessage(message,NotificationMessageType.Info)
	}
	
	addSuccessMessage(message:INotificationMessage|string) {
		this.addMessage(message,NotificationMessageType.Success)
	}
	
	addErrorMessage(err:Error|string) {
		if (isString(err)) {
			err = new Error(err)
		}
		const
			payload = _.pick(err, 'message', 'code', 'stack', 'description') as any
		
		this.uiActions.addErrorMessage(payload)
	}
}

let notificationCenter:NotificationCenter = null

/**
 * get the current notificationCenter
 *
 * @returns {NotificationCenter}
 */
export function getNotificationCenter() {
	if (!notificationCenter)
		notificationCenter = new NotificationCenter()
	
	return notificationCenter
}

/**
 * Bind singleton accessor to the container
 */
Container.bind(NotificationCenter).provider({get: getNotificationCenter})

declare global {
	function getNotificationCenter():NotificationCenter
}

export {
	
}