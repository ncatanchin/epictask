

/**
 * Notification types
 */
declare enum NotificationType {
	Debug = 1,
	Info = 2,
	Success = 3,
	Error = 4
}

/**
 * Notification actions
 */
declare interface INotificationAction {
	label:string
	execute:Function
}


/**
 * Notification message shape
 */
declare interface INotification {
	id:string
	createdAt:number
	type:NotificationType
	notify?:boolean
	floatVisible?:boolean
	content:any
	actions?:INotificationAction[]
}