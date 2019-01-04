import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IIssue} from "common/models/Issue"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {formatTimestamp, getAPI} from "../net/GithubAPI"
import {getValue, guard} from "typeguard"
import {AppState} from "common/store/state/AppState"
import {IUser} from "common/models/User"
import * as _ from 'lodash'
import delay from "common/util/Delay"
import EventHub from "common/events/Event"
import {APIConcurrency} from "common/Constants"
import {IRepo} from "common/models/Repo"
import * as BBPromise from 'bluebird'
import {ILabel} from "common/models/Label"
import {nextTick} from "typedux"
const log = getLogger(__filename)

class IssueObjectManager extends ObjectManager<IIssue, number> {
	
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
	
	
	protected async doSync(...keys:number[]):Promise<boolean> {
		try {
			const
				gh = getAPI(),
				state = getStoreState(),
				{user,enabledRepoIds} = state.AppState,
				repos = await db.repos.where("id").anyOf(enabledRepoIds).toArray()
			
			log.info("Syncing issues", repos)
			if (!user) {
				log.warn("Can not sync issues, not authenticated")
				return false
			}
			
			
			const
				syncedAt = Date.now(),
				issues = Array<IIssue>()
			
			await BBPromise.map(repos, async (repo:IRepo) => {
				try {
					const
						timestamp = getValue(() => getStoreState().AppState.syncs["issues"].records[repo.id].timestamp, 0) as number,
						repoParams = {
							owner: repo.owner.login,
							repo: repo.name
						},
						params = {
							...repoParams,
							since: formatTimestamp(timestamp)
						},
						opts = (gh.issues.listForRepo as any).endpoint.merge(params)
					
					log.info(`Syncing issues for ${repo.full_name} since ${params.since} `)
					
					// SYNC LABELS
					const labels = (await (gh as any).paginate((gh as any).issues.listLabelsForRepo.endpoint.merge(repoParams)) as Array<ILabel>)
						.map(label => ({...label,repository_url: repo.url} as ILabel))
					await db.labels.bulkPut(labels)
					
					
					// SYNC ISSUES
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
				return Promise.resolve(true)
			}, {
				concurrency: APIConcurrency
			})
			
			
			log.info(`Loaded ${issues.length} issues`)
			
			this.emit(ObjectEvent.Synced, syncedAt, issues)
			return true
		} catch (err) {
			log.error("Unable to sync issues", err)
		}
		
		return false
	}
}

let issueObjectManager:IssueObjectManager | null = null

export default function get():IssueObjectManager {
	if (!issueObjectManager)
		issueObjectManager = new IssueObjectManager()
	
	return issueObjectManager
}


