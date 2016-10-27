import * as uuid from 'node-uuid'
import { isString } from  "./TypeChecks"
import {Container} from 'typescript-ioc'

const
	log = getLogger(__filename)


/**
 * Notification types
 */
export enum NotificationMessageType {
	Debug = 1,
	Info,
	Success,
	Error
}

/**
 * Notification actions
 */
export interface INotificationMessageAction {
	label:string
	execute:Function
}


/**
 * Notification message shape
 */
export interface INotificationMessage {
	id:string
	createdAt:number
	type:NotificationMessageType
	notify?:boolean
	floatVisible?:boolean
	content:any
	actions?:INotificationMessageAction[]
}

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
		
		//this.uiActions.addErrorMessage(payload)
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


export function clearMessages() {
	this.uiActions.clearMessages()
}

/**
 * Report message to ui from anywhere
 *
 * @param message
 * @param type
 */
export function addMessage(message:INotificationMessage|string,type:NotificationMessageType = NotificationMessageType.Info) {
	getNotificationCenter().addMessage(message,type)
}

export function addSuccessMessage(message:INotificationMessage|string) {
	getNotificationCenter().addSuccessMessage(message)
}

export function addDebugMessage(message:INotificationMessage|string) {
	getNotificationCenter().addDebugMessage(message)
}

export function addInfoMessage(message:INotificationMessage|string) {
	getNotificationCenter().addInfoMessage(message)
}


/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function addErrorMessage(err:Error|string) {
	getNotificationCenter().addErrorMessage(err)
}


export default NotificationCenter
