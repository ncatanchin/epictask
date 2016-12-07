

/**
 * Notification types
 */
export enum NotificationType {
	Debug = 1,
	Info,
	Success,
	Error
}

/**
 * Notification actions
 */
export interface INotificationAction {
	label:string
	execute:Function
}


/**
 * Notification message shape
 */
export interface INotification {
	id:string
	createdAt:number
	type:NotificationType
	notify?:boolean
	floatVisible?:boolean
	content:any
	actions?:INotificationAction[]
}


export function clearNotifications() {
	this.uiActions.clearNotifications()
}

/**
 * Report message to ui from anywhere
 *
 * @param message
 * @param type
 */
export function notify(message:INotification|string, type:NotificationType = NotificationType.Info) {
	getNotificationCenter().notify(message,type)
}

export function notifySuccess(message:INotification|string) {
	getNotificationCenter().notifySuccess(message)
}

export function notifyDebug(message:INotification|string) {
	getNotificationCenter().notifyDebug(message)
}

export function notifyInfo(message:INotification|string) {
	getNotificationCenter().notifyInfo(message)
}


/**
 * Report an error to the UI from anywhere
 *
 * @param err
 */
export function notifyError(err:Error|string) {
	getNotificationCenter().notifyError(err)
}

