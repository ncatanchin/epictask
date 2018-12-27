import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IIssue} from "../models/Issue"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {formatTimestamp, getAPI} from "../net/GithubAPI"
import {getValue, guard} from "typeguard"
import {AppState} from "../store/state/AppState"
import {IUser} from "../models/User"
import * as _ from 'lodash'
import delay from "common/util/Delay"
import EventHub from "common/events/Event"

const log = getLogger(__filename)

class IssueObjectManager extends ObjectManager<IIssue, number> {
	
	private syncing = false
	
	constructor() {
		super(db.issues)
		
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
	
	getPrimaryKey(o:IIssue):number {
		return o.id
	}
	
	onChange(o:IIssue) {
	}
	
	onRemove(key:number) {
	}
	
	
	async sync(...keys:number[]):Promise<boolean> {
		if (this.syncing) return true
		this.syncing = true
		
		try {
			const
				gh = getAPI(),
				state = getStoreState(),
				{user} = state.AppState,
				repos = await db.repos.toArray()
			
			if (!user) {
				log.warn("Can not sync issues, not authenticated")
				return false
			}
			
			
			const
				syncedAt = Date.now(),
				issues = Array<IIssue>()
			
			for (const repo of repos) {
				try {
					const
						timestamp = getValue(() => getStoreState().DataState.syncs["issues"].records[repo.id].timestamp, 0) as number,
						params = {
							owner: repo.owner.login,
							repo: repo.name,
							since: formatTimestamp(timestamp)
						},
						opts = (gh.issues.listForRepo as any).endpoint.merge(params)
					
					//log.info(`Syncing issues for ${repo.full_name} since ${params.since} `)
					
					const repoIssues = Array<IIssue>()
					for await (const response of ((gh as any).paginate.iterator(opts))) {
						repoIssues.push(...response.data)
						await delay(10)
					}
					
					await this.table.bulkPut(repoIssues)
					EventHub.emit("RepoIssuesSynced",repo.id,syncedAt)
					issues.push(...repoIssues)
				} catch (err) {
					log.error(`Failed to sync: ${repo.full_name}`,err)
				}
				await delay(50)
			}
			
			
			log.info(`Loaded ${issues.length} issues`)
			
			this.emit(ObjectEvent.Synced, syncedAt, issues)
			return true
		} catch (err) {
			log.error("Unable to sync issues", err)
			return false
		} finally {
			this.syncing = false
		}
	}
}

let issueObjectManager:IssueObjectManager | null = null

export default function get():IssueObjectManager {
	if (!issueObjectManager)
		issueObjectManager = new IssueObjectManager()
	
	return issueObjectManager
}


