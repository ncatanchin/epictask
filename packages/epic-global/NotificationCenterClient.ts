

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

const
	log = getLogger(__filename)



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

