import {GithubSyncStatus as SyncStatus} from "epic-global"
import { createClient, GitHubClient } from "epic-github"
import { getValue } from "typeguard"
import { NotificationsKey } from "epic-global"
import {GithubNotification} from 'epic-models'
const
	log = getLogger(__filename)

export namespace NotificationSync {
	
	let working = false
	
	async function handleNotificationsPage(pageNumber:number, totalPages:number, items:GithubNotification[]) {
		
	}
	
	async function syncSince(client:GitHubClient) {
		try {
			if (working)
				return log.debug(`Already running`)
			
			const
				params = assign(
					SyncStatus.getSinceTimestampParams(
						NotificationsKey, /* 90 DAYS INITIALLY */(90 * 24 * 60 * 60 * 10000)
					),{ all: true })
			
			const
				allNotifications = client.notifications(params)
		} catch (err) {
			log.error(err)
		}
		
		
		
		
		
	}
	
	export function execute() {
		const
			client = getValue(() => createClient())
		
		if (!client) {
			return log.warn(`Not authenticated, can not create client`)
		}
		
		syncSince(client)
	}
}