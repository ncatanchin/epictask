import ObjectManager, {ObjectEvent} from "./ObjectManager"
import {IIssue, IIssueEvent} from "common/models/Issue"
import db from "./ObjectDatabase"
import getLogger from "../../common/log/Logger"
import {formatTimestamp, getAPI} from "renderer/net/GithubAPI"
import {getValue, guard, isDefined} from "typeguard"
import {AppState} from "common/store/state/AppState"
import {IUser} from "common/models/User"
import * as _ from 'lodash'
import delay from "common/util/Delay"
import EventHub from "common/events/Event"
import {APIConcurrency} from "common/Constants"
import {ICollaborator, IRepo} from "common/models/Repo"
import * as BBPromise from 'bluebird'
import {getLabels, getMilestones, getRepoParams} from "renderer/net/RepoAPI"
import {IComment} from "common/models/Comment"
import {findIssueIdFromComment, findIssueIdFromEvent} from "renderer/net/IssueAPI"
import * as moment from "moment"
import {makeStatusMessage, pushStatusMessage} from "common/util/AppStatusHelper"
import timestampCache from "common/util/TimestampCache"
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

			log.debug("Syncing issues", repos)
			if (!user) {
				log.warn("Can not sync issues, not authenticated")
				return false
			}

      pushStatusMessage(makeStatusMessage("Synchronizing Issues"))

			const
				syncedAt = Date.now(),
				issues = Array<IIssue>()

			await BBPromise.map(repos, async (repo:IRepo) => {
				try {
					const
						timestampId = `repo-${repo.id}-issues`,
						timestamp = timestampCache.get(timestampId,0),
						repoParams = getRepoParams(repo),
						params = {
							...repoParams,
							per_page: 100,
							since: formatTimestamp(timestamp)
						},
						issueOpts = (gh.issues.listForRepo as any).endpoint.merge({
							...params,
							state: "all",
							sort: "updated",
							direction: "asc"
						}),
            // issueEventOpts = (gh.issues.listEventsForRepo as any).endpoint.merge({
						// 	...params
						// }),
            collabOpts = (gh.repos.listCollaborators as any).endpoint.merge({
              ...params,
							affiliation: "all"
            })

					log.debug(`Syncing issues for ${repo.full_name} since ${params.since} `)

					// SYNC LABELS
					const labels = await getLabels(repo)
					await db.labels.bulkPut(labels)

          // SYNC MILESTONES
          const milestones = await getMilestones(repo)
          await db.milestones.bulkPut(milestones)

          // SYNC REPO Collaborators
          if (getValue(() => repo.permissions.push,false)) {
            const repoCollabs = Array<ICollaborator>()
            for await (const response of ((gh as any).paginate.iterator(collabOpts))) {
              const collabs: Array<ICollaborator> = await Promise.all(response.data.map(async (collab: ICollaborator): Promise<ICollaborator> => ({
                ...collab,
                repository_url: repo.url,
              }))) as any

              repoCollabs.push(...collabs)
              // if (collabs.some(event => moment(event.created_at).valueOf() < timestamp))
              //   break

              await delay(10)
            }

            await db.collaborators.bulkPut(repoCollabs)
          }

					// SYNC ISSUES
					const repoIssues = Array<IIssue>()
					for await (const response of ((gh as any).paginate.iterator(issueOpts))) {
						repoIssues.push(...response.data)

						const maxUpdatedAt = Math.max(...response.data.map(issue => moment(issue.updated_at).valueOf()))
						timestampCache.set(timestampId, maxUpdatedAt)
						await this.table.bulkPut(response.data)
					}



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
      pushStatusMessage(makeStatusMessage("Synchronized"))

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


