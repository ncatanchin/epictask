import { GithubSyncStatus as SyncStatus } from "epic-global"
import {getMillis} from 'epic-util'
import { createClient, GitHubClient } from "epic-github"
import { getValue } from "typeguard"
import { NotificationsKey } from "epic-global"
import {GithubNotification} from 'epic-models'
import { getStores, chunkSave } from "epic-database-client"
const
	log = getLogger(__filename)

//log.setOverrideLevel(LogLevel.DEBUG)

export namespace NotificationSync {
	
	let working = false
	
	async function processNotifications(all:IGithubNotification[]) {
		const
			stores = getStores(),
			nStore = stores.notification,
			current = await nStore.bulkGet(...all.map(it => it.id)),
			pending = []
		
		let updateCount = 0
		
		all.forEach(n => {
			let
				ignore = false,
				isNew = true
			
			for (let existing of current) {
				if (!existing)
					continue
				
				if (existing.id === n.id) {
					isNew = false
					if (getMillis(existing.updated_at) >= getMillis(n.updated_at)) {
						ignore = true
					} else {
						log.info('updated notification',n)
						updateCount++
					}
					break
				}
			}
			
			if (!ignore) {
				pending.push(n)
			}
			
			if (isNew) {
				log.info('new notification',n)
				updateCount++
			}
		})
		
		log.debug(`Persisting ${pending.length} notifications of ${all.length} received`)
		
		if (pending.length)
			await chunkSave(pending,nStore)
		
		SyncStatus.setMostRecentTimestamp(NotificationsKey, pending, 'updated_at')
		
		if (updateCount)
			getNotificationCenter().notifyWithSound(`${updateCount} notification updates received from GitHub`,"Ding")
	}
	
	async function syncSince(client:GitHubClient) {
		try {
			if (working)
				return log.debug(`Already running`)
			
			const
				params = assign(
					SyncStatus.getSinceTimestampParams(NotificationsKey),
					//{since: moment(new Date(1)).format()},
					{ all: true })
			
			const
				all = await client.notifications({params})
			
			log.debug(`Received ${all.length} notifications to process`)
			if (!all.length) {
				return log.debug(`Notifications list is empty, no updates`)
			}
			
			processNotifications(all)
			
		} catch (err) {
			log.error(`Failed to get notifications`,err)
		} finally {
			working = false
		}
		
	}
	
	export function execute(notifications:IGithubNotification[] = null) {
		if (!notifications || !notifications.length) {
			const
				client = getValue(() => createClient())
			
			if (!client) {
				return log.warn(`Not authenticated, can not create client`)
			}
			
			syncSince(client)
		} else {
			processNotifications(notifications)
		}
		
	}
}

assignGlobal({
	NotificationSync
})