import {getAPI} from "renderer/net/GithubAPI"
import {
  IIssue,
  IIssueEvent,
  IIssueEventData, IIssueEventTimelineItem,
  IssueEventTimelineItemPayloadType,
  IssueEventTimelineItemType
} from "common/models/Issue"
import db from "renderer/db/ObjectDatabase"
import {IssuesCreateParams, IssuesUpdateParams} from "@octokit/rest"
import {DataActionFactory} from "common/store/actions/DataActionFactory"
import {selectedIssuesSelector, selectedRepoSelector} from "common/store/selectors/DataSelectors"
import {getValue, isDefined, isNumber} from "typeguard"
import {ICollaborator, IRepo} from "common/models/Repo"
import {IComment} from "common/models/Comment"
import * as _ from "lodash"
import getLogger from "common/log/Logger"
import * as moment from "moment"
import {IMilestone} from "common/models/Milestone"
import {ILabel} from "common/models/Label"
import {Omit} from "common/Types"

const log = getLogger(__filename)


export async function createComment(issue:IIssue | number, body:string):Promise<IComment> {
  if (isNumber(issue)) {
    issue = await db.issues.get(issue)
  }

  const
    issueId = issue.id,
    issueNumber = issue.number


  const
    gh = getAPI(),
    repo = await db.repos.where("url").equals(issue.repository_url).first(),
    newComment = (await gh.issues.createComment({
      owner: repo.owner.login,
      repo: repo.name,
      number: issueNumber,
      body
    })).data,
    comment = {...newComment,issue_id: issueId} as IComment


  await db.comments.put(comment)

  if (getValue(() => selectedIssuesSelector(getStoreState()).some(selectedIssue => selectedIssue.id === issueId))) {
    new DataActionFactory().setIssueEventData(await getIssueEvents(issueId))
  }


  return comment
}

export async function patchComment(issue:IIssue | number, comment:IComment | number, body:string):Promise<IComment> {
  if (isNumber(issue)) {
    issue = await db.issues.get(issue)
  }

  const issueId = issue.id

  if (isNumber(comment)) {
    comment = await db.comments.get(comment)
  }

  const
    gh = getAPI(),
    repo = await db.repos.where("url").equals(issue.repository_url).first(),
    updatedComment = (await gh.issues.updateComment({
      owner: repo.owner.login,
      repo: repo.name,
      body,
      comment_id:comment.id
    })).data,
    newComment = {...comment,...updatedComment,issue_id: comment.issue_id}


  await db.comments.put(newComment)

  if (getValue(() => selectedIssuesSelector(getStoreState()).some(selectedIssue => selectedIssue.id === issueId))) {
    new DataActionFactory().setIssueEventData(await getIssueEvents(issueId))
  }


  return newComment
}


export async function createIssue(repo:IRepo, params:Omit<IssuesCreateParams,"owner" | "repo">):Promise<IIssue> {
  const
    gh = getAPI(),
    newIssue = (await gh.issues.create({
      owner: repo.owner.login,
      repo: repo.name,
      ...params
    })).data as IIssue

  await db.issues.put(newIssue)

  log.info("Created issue", newIssue)
  new DataActionFactory().updateIssue(newIssue)
  return newIssue
}

/**
 * Patch an issue on Github
 *
 * @param issue
 * @param props
 */
export async function patchIssue(issue:IIssue | number,props:Partial<IssuesUpdateParams> | null):Promise<IIssue> {
  if (isNumber(issue)) {
    issue = await db.issues.get(issue)
  }

  const
    gh = getAPI(),
    repo = await db.repos.where("url").equals(issue.repository_url).first()

  if (!repo)
    throw Error(`Unable to find repo: ${issue.repository_url}`)


  await gh.issues.update({
    owner: repo.owner.login,
    repo: repo.name,
    number:issue.number,
    ...props
  })

  const
    updatedIssue = (await gh.issues.get({
      owner: repo.owner.login,
      repo: repo.name,
      number:issue.number
    })).data as IIssue


  const
    newIssue = {...issue,...updatedIssue} as IIssue

  await db.issues.put(newIssue)

  if (getValue(() => selectedRepoSelector(getStoreState()).url === newIssue.repository_url )) {
    new DataActionFactory().updateIssue(newIssue)
  }

  return newIssue
}

export async function patchIssueMilestone(issue:IIssue | number,milestone: IMilestone | null):Promise<IIssue> {
  return await patchIssue(issue,{
    milestone: milestone ? milestone.number : null
  })
}

export async function patchIssueAssignees(issue:IIssue | number,assignees: Array<ICollaborator>):Promise<IIssue> {
  return await patchIssue(issue,{
    assignees: assignees.map(assignee => assignee.login)
  })
}

export async function patchIssueLabels(issue:IIssue | number,labels: Array<ILabel>):Promise<IIssue> {
  return await patchIssue(issue,{
    labels: labels.map(label => label.name)
  })
}


/**
 * Retrieve an issue from the database
 *
 * @param id
 */
export function getIssue(id:number):Promise<IIssue> {
  return db.issues.get(id)
}


/**
 * Find issue id for comment
 *
 * @param repo
 * @param comment
 */
export async function findIssueIdFromComment(repo:IRepo, comment:IComment):Promise<number | null> {
  const
    url = comment.html_url,
    urlParts = url.split("/"),
    issueParts = _.last(urlParts).split("#")[0],
    number = parseInt(issueParts,10)

  let issueId:number | null = null
  if (comment.issue_url) {
    const issues = await db.issues.where("url").equals(comment.issue_url).toArray()
    issueId = !issues.length ? null : issues[0].id
  }

  if (!isDefined(issueId) && isDefined(number) && number > 0) {
    const issues = await db.issues.where("repository_url").equals(repo.url).filter(issue => issue.number === number).toArray()
    issueId = !issues.length ? null : issues[0].id
  }

  return issueId
}


export async function findIssueIdFromEvent(repo:IRepo, event:IIssueEvent):Promise<number | null> {
  return getValue(() => event.issue.id, null)
}


export async function getIssueEvents(issueId:number):Promise<IIssueEventData> {
  const
    issue = await getIssue(issueId),
    repo = await db.repos.where("url").equals(issue.repository_url).first(),
    events = await db.issueEvents.where("issue_id").equals(issueId).toArray(),
    comments = (await db.comments.where("issue_id").equals(issueId).toArray())
      .map(comment => ({
        ...comment,
        repo,
        repository_url: repo.url
      })),
    timeline = [
      ...events.map(event => ({
        type: "activity",
        timestamp: moment(event.created_at).valueOf(),
        payload: event
      })),
      ...comments.map(comment => ({
        type: "comment",
        timestamp: moment(comment.created_at).valueOf(),
        payload: comment
      }))
    ].sortBy(timelineEvent => timelineEvent.timestamp)

  return {
    events,
    comments,
    timeline
  }
}



export function isTimelineComment<
  K extends IssueEventTimelineItemType = any,
  P extends IssueEventTimelineItemPayloadType<K> = any
>(timelineEvent:IIssueEventTimelineItem<K,P>):timelineEvent is IIssueEventTimelineItem<K,IComment> {
  return timelineEvent.type === "comment"
}

