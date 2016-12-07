import { ObservableStore } from "typedux"

import { BaseService, IServiceConstructor, RegisterService } from "./internal"
import { ProcessType, NotificationType, UIKey } from "epic-global"
import DatabaseClientService from "./DatabaseClientService"
import { getUIActions } from "epic-typedux"
import { PersistentValueEvent, cloneObjectShallow } from "epic-global"
import { SettingsPath } from "epic-global/Constants"
import { addHotDisposeHandler, acceptHot } from "epic-global/HotUtils"

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)






@RegisterService(ProcessType.UI)
export class ToastService extends BaseService {

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
		
		getUIActions().clearNotifications()
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
							
							getUIActions().updateMessage(newMsg)
							
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
						timeout = isError ? 60000 : 5000,
						{nativeNotificationsEnabled} = getSettings()
					
					log.info(`Native notification`, nativeNotificationsEnabled, msg)
					if (nativeNotificationsEnabled && !this.pendingNotifications[msg.id]) {
						const
							title = isError ? 'an error occurred' : 'epictask'
						
						this.pendingNotifications[msg.id] = new Notification(title,{
							//title:
							body: msg.content || msg.message || 'no message available'
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
		//this.clear()
		
		getNotificationCenter().notify("Notification configuration changed successfully")
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
			[UIKey, 'messages'],
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


export default ToastService

acceptHot(module,log)
