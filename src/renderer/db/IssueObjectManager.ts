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

      pushStatusMessage(makeStatusMessage("Synchronizing Issues"))

			const
				syncedAt = Date.now(),
				issues = Array<IIssue>()

			await BBPromise.map(repos, async (repo:IRepo) => {
				try {
					const
						timestamp = getValue(() => getStoreState().AppState.syncs["issues"].records[repo.id].timestamp, 0) as number,
						repoParams = getRepoParams(repo),
						params = {
							...repoParams,
							since: formatTimestamp(timestamp)
						},
						issueOpts = (gh.issues.listForRepo as any).endpoint.merge({
							...params,
							state: "all",
							sort: "updated",
							direction: "desc"
						}),
            commentOpts = (gh.issues.listCommentsForRepo as any).endpoint.merge({
							...params,
							sort: "updated",
							direction: "asc"
            }),
            issueEventOpts = (gh.issues.listEventsForRepo as any).endpoint.merge({
							...params
						}),
            collabOpts = (gh.repos.listCollaborators as any).endpoint.merge({
              ...params,
							affiliation: "all"
            })

					log.info(`Syncing issues for ${repo.full_name} since ${params.since} `)

					// SYNC LABELS
					const labels = await getLabels(repo)
					await db.labels.bulkPut(labels)

          // SYNC MILESTONES
          const milestones = await getMilestones(repo)
          await db.milestones.bulkPut(milestones)

					// SYNC ISSUES
					const repoIssues = Array<IIssue>()
					for await (const response of ((gh as any).paginate.iterator(issueOpts))) {
						repoIssues.push(...response.data)
						await delay(10)
					}

          await this.table.bulkPut(repoIssues)

					// SYNC COMMENTS
          const repoComments = Array<IComment>()
          for await (const response of ((gh as any).paginate.iterator(commentOpts))) {
            const comments:Array<IComment> = await Promise.all(response.data.map(async (comment:IComment):Promise<IComment> => ({
							...comment,
							issue_id:await findIssueIdFromComment(repo, comment)
            }))) as any

          	repoComments.push(...comments)
            await delay(10)
          }

					await db.comments.bulkPut(repoComments)

          // SYNC ISSUE EVENTS
          const repoIssueEvents = Array<IIssueEvent>()
          for await (const response of ((gh as any).paginate.iterator(issueEventOpts))) {
            const events:Array<IIssueEvent> = await Promise.all(response.data.map(async (event:IIssueEvent):Promise<IIssueEvent> => ({
							...event,
							issue_id: getValue(() => event.issue.id, null),
							repo_id: getValue(() => event.repo.id, null)
						}))) as any

            repoIssueEvents.push(...events)
            if (events.some(event => moment(event.created_at).valueOf() < timestamp))
            	break

						await delay(10)
          }

          await db.issueEvents.bulkPut(repoIssueEvents)

          // SYNC REPO Collaborators
          const repoCollabs = Array<ICollaborator>()
          for await (const response of ((gh as any).paginate.iterator(collabOpts))) {
            const collabs:Array<ICollaborator> = await Promise.all(response.data.map(async (collab:ICollaborator):Promise<ICollaborator> => ({
              ...collab,
              repository_url: repo.url,
            }))) as any

            repoCollabs.push(...collabs)
            // if (collabs.some(event => moment(event.created_at).valueOf() < timestamp))
            //   break

            await delay(10)
          }

          await db.collaborators.bulkPut(repoCollabs)

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


