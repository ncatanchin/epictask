



export function clearNotifications() {
	this.appActions.clearNotifications()
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

