import {uuid} from 'epic-util'
import { isString } from  "typeguard"
import {Container} from 'typescript-ioc'

const
	log = getLogger(__filename)

export enum NotificationType {
	Debug = 1,
	Info = 2,
	Success = 3,
	Error = 4
}

Object.assign(global,{
	NotificationType
})

/**
 * NotificationCenter functions for use globally
 */
export class NotificationCenter {
	
	get appActions():IAppActionFactory {
		return require("epic-typedux/provider").getAppActions()
	}
	
	notify(message:INotification|string, type:NotificationType = NotificationType.Info,opts:any = {}) {
		if (_.isString(message)) {
			message = {
				id: uuid(),
				createdAt: Date.now(),
				type: type,
				content: message,
				floatVisible: true,
				opts
			} as INotification
		} else {
			message.type = type
		}
		this.appActions.addNotification(message)
	}
	
	notifyDebug(message:INotification|string) {
		this.notify(message,NotificationType.Debug)
	}
	
	notifyInfo(message:INotification|string) {
		this.notify(message,NotificationType.Info)
	}
	
	notifySuccess(message:INotification|string) {
		this.notify(message,NotificationType.Success)
	}
	
	notifyError(err:Error|string) {
		if (isString(err)) {
			err = new Error(err)
		}
		const
			payload = _.pick(err, 'message', 'code', 'stack', 'description') as any
		
		this.appActions.notifyError(payload)
	}
	
	notifyWithSound(message:INotification|string,soundKey:TSoundKey) {
		const
			sound = Sounds[soundKey],
			src = sound.src.find(it => it.endsWith('.webm')) || sound.src[0]
		
		log.tron(`Notification Sound src: ${src}`)
		this.notify(
			message,
			NotificationType.Info,
			{ silent: true }
		)
		
		PlaySound(soundKey)
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