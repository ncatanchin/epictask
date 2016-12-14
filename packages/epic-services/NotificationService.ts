import { ObservableStore } from "typedux"

import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import { ProcessType, UIKey, AppKey } from "epic-global"
import DatabaseClientService from "./DatabaseClientService"
import { getUIActions } from "epic-typedux"
import { PersistentValueEvent, cloneObjectShallow } from "epic-global"
import { SettingsPath } from "epic-global/Constants"
import { addHotDisposeHandler, acceptHot } from "epic-global/HotUtils"
import { getAppActions } from "epic-typedux/provider"
import { WindowIconUrl256, WindowIconPath256, WindowIconPath128 } from "epic-process-manager-client"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)






@RegisterService(ProcessType.JobServer)
export class NotificationService extends BaseService {

	private unsubscribe:Function
	private pendingTimers = {}
	private pendingNotifications = {}

	private store:ObservableStore<any>
	
	/**
	 * Clears all current notifications, native or in UI
	 */
	private clear() {
		if (this.unsubscribe) {
			this.unsubscribe()
			this.unsubscribe = null
		}
		
		
		Object
			.keys(this.pendingTimers)
			.forEach(timerId => clearTimeout(this[timerId]))
		
		getAppActions().clearNotifications()
	}
	
	
	/**
	 * Clear a pending notification if it exists
	 *
	 * @param msg
	 */
	private clearNativeNotification(msg) {
		const
			nativeNotification = this.pendingNotifications[msg.id]
		
		if (nativeNotification) {
			nativeNotification.close && nativeNotification.close()
			delete this.pendingNotifications[msg.id]
		}
	}
	
	/**
	 * Handles changes triggered by observing
	 *
	 * @param newMessages
	 */
	private onMessagesChanged = (newMessages) => {
		log.info('messages changed',newMessages)
		try {
			newMessages
				.filter(msg => msg.floatVisible)
				.forEach(msg => {
					
					msg = _.toJS(msg)
					
					const
						stopFloating = () => {
							const
								newMsg = cloneObjectShallow(msg, { floatVisible: false })
							
							getAppActions().updateNotification(newMsg)
							
							// CLEAR NATIVE TOO
							this.clearNativeNotification(msg)
							
							
							delete this.pendingTimers[ msg.id ]
						},
						isError = msg.type === NotificationType.Error
					
					
					// Don't add a remove timer for Error messages
					// if (msg.type === NotificationMessageType.Error)
					// 	return
					
					if (this.pendingTimers[ msg.id ]) {
						log.debug(`Timer already exists for message: ${msg.id}`)
						return
					}
					
					const
						timeout = isError ? 120000 : 30000,
						{nativeNotificationsEnabled} = getSettings()
					
					log.info(`Native notification`, nativeNotificationsEnabled, msg)
					if (nativeNotificationsEnabled && !this.pendingNotifications[msg.id]) {
						const
							title = isError ? 'an error occurred' : 'epictask'
						
						this.pendingNotifications[msg.id] = new Notification(title,{
							//title:
							body: msg.content || msg.message || 'no message available',
							icon: WindowIconPath128
						})
					}
					
					// Add the remove timer
									
					this.pendingTimers[ msg.id ] = setTimeout(stopFloating, timeout)
				})
		} catch (err) {
			log.error(`Failed to handle messages`,err)
		}
	}
	
	
	
	/**
	 * On notification config change then update stuff
	 */
	private onNotificationConfigChange = () => {
		log.debug(`Notification configuration changed`)
		//this.clear()
		//getNotificationCenter().notify("Notification configuration changed successfully")
	}
	
	/**
	 * DatabaseClientService must be loaded first
	 *
	 * @returns {DatabaseClientService[]}
	 */
	dependencies(): IServiceConstructor[] {
		return [DatabaseClientService]
	}
	
	
	init(): Promise<this> {
		this.store = Container.get(ObservableStore as any) as any
		return super.init()
	}
	
	
	
	
	
	 
	
	/**
	 * Start the toast manager
	 *
	 * @returns {Promise<BaseService>}
	 */
	async start() {
		await super.start()
		
		const
			settingsUnsubscribe = this.store.observe(
				[...SettingsPath,'nativeNotificationsEnabled'],
				this.onNotificationConfigChange)
		
		
		
		this.unsubscribe = this.store.observe(
			[AppKey, 'messages'],
			this.onMessagesChanged
		)
		
		addHotDisposeHandler(module,() => {
			settingsUnsubscribe()
			this.clear()
		})
		
		return this
	}

	async stop() {
		this.clear()
		return super.stop()
	}


}


export default NotificationService

acceptHot(module,log)
