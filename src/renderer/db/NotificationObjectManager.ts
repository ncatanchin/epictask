import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {INotification} from "common/models/Notification"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {getAPI} from "renderer/net/GithubAPI"
import {getValue, guard, isDefined} from "typeguard"
import {AppState} from "common/store/state/AppState"
import {IUser} from "common/models/User"
import EventHub from "common/events/Event"
import {makeStatusMessage, pushStatusMessage} from "common/util/AppStatusHelper"
import {getNotifications} from "renderer/net/NotificationAPI"
const log = getLogger(__filename)



class NotificationObjectManager extends ObjectManager<INotification, string> {

	constructor() {
		super(db.notifications)

		getStore().observe([AppState.Key, 'user'], (user:IUser | null) => {
			if (user) {
				guard(() => this.sync())
			}
		})

		guard(() => this.sync())

	}

	async clear():Promise<any> {
		return undefined;
	}

	getPrimaryKey(o:INotification):string {
		return o.id
	}

	onChange(o:INotification) {
	}

	onRemove(key:string) {
	}


	protected async doSync(...keys:string[]):Promise<boolean> {
		try {
			const
				gh = getAPI(),
				state = getStoreState(),
				{user} = state.AppState

			log.debug("Syncing Notifications")
			if (!user) {
				log.warn("Can not sync Notifications, not authenticated")
				return false
			}

      pushStatusMessage(makeStatusMessage("Synchronizing Notifications"))

			const
				syncedAt = Date.now(),
        fromTimestamp = getValue(() => getStoreState().AppState.syncs["notifications"].records[0].timestamp, 0) as number,
				notifications = await getNotifications(fromTimestamp)

			await db.notifications.bulkPut(notifications)
			EventHub.emit("NotificationsSynced",syncedAt)


			log.info(`Updated ${notifications.length} notifications`)
      pushStatusMessage(makeStatusMessage("Synchronized"))

			this.emit(ObjectEvent.Synced, syncedAt)
			return true
		} catch (err) {
			log.error("Unable to sync Notifications", err)
		}

		return false
	}
}

let notificationObjectManager:NotificationObjectManager | null = null

export default function get():NotificationObjectManager {
	if (!notificationObjectManager)
		notificationObjectManager = new NotificationObjectManager()

	return notificationObjectManager
}


