
import {
  IssuesCreateResponse,
  IssuesListEventsResponseItem
} from "@octokit/rest"
import {ILabel} from "common/models/Label"
import {IMilestone} from "./Milestone"
import {IBranch, IRepo} from "common/models/Repo"
import {convertEnumValuesToString} from "common/ObjectUtil"
import {IUser} from "common/models/User"
import {IComment} from "common/models/Comment"

export interface IIssue extends IssuesCreateResponse {
	labels: Array<ILabel>
	milestone: IMilestone
}

export const IssueIndexes = {
	v1: "&id,url,repository_url,title,body"
}

export interface IIssueEvent extends IssuesListEventsResponseItem {
	issue?: Partial<IIssue>
  repo?: Partial<IRepo>
  labels?: Array<ILabel>
  label?: ILabel
  milestone?: IMilestone
  assignee?: IUser
  assignees?: Array<IUser>
  assigner?: IUser
	type:  IssueEventType
	issue_id?: number
	repo_id?: number
  payload?: IUser | IRepo | IMilestone | ILabel | IBranch
}

export const IssueEventIndexes = {
  v1: "&id,issue_id"
}

// noinspection JSUnusedGlobalSymbols
export enum IssueEventType {
  // noinspection JSUnusedGlobalSymbols
  added_to_project,//	The issue was added to a project board. You only see this event in responses when project boards have been enabled in the repository.
  assigned,//	The issue was assigned to the actor.
  closed,//	The issue was closed by the actor. When the commit_id is present, it identifies the commit that closed the issue using "closes / fixes #NN" syntax.
  converted_note_to_issue,//	The issue was created by converting a note in a project board to an issue. You only see this event in responses when project boards have been enabled in the repository.
  demilestoned,//	The issue was removed from a milestone.
  head_ref_deleted,//	The pull request's branch was deleted.
	head_ref_restored,//	The pull request's branch was restored.
	labeled,//	A label was added to the issue.
  locked,//	The issue was locked by the actor.
  mentioned,//	The actor was @mentioned in an issue body.
  marked_as_duplicate,//	A user with write permissions marked an issue as a duplicate of another issue or a pull request as a duplicate of another pull request.
  merged,//	The issue was merged by the actor. The commit_id attribute is the SHA1 of the HEAD commit that was merged.
  milestoned,//	The issue was added to a milestone.
  moved_columns_in_project,//	The issue was moved between columns in a project board. You only see this event in responses when project boards have been enabled in the repository.
  referenced,//	The issue was referenced from a commit message. The commit_id attribute is the commit SHA1 of where that happened.
  removed_from_project,//	The issue was removed from a project board. You only see this event in responses when project boards have been enabled in the repository.
  renamed,//	The issue title was changed.
  reopened,//	The issue was reopened by the actor.
  review_dismissed,//	The actor dismissed a review from the pull request.
  review_requested,//	The actor requested review from the subject on this pull request.
  review_request_removed,//	The actor removed the review request for the subject on this pull request.
  subscribed,//	The actor subscribed to receive notifications for an issue.
  unassigned,//	The actor was unassigned from the issue.
  unlabeled,//	A label was removed from the issue.
  unlocked,//	The issue was unlocked by the actor.
  unmarked//_as_duplicate	An issue that a user had previously marked as a duplicate of another issue is no longer considered a duplicate, or a pull request that a user had previously marked as a duplicate of another pull request is no longer considered a duplicate.
}

// noinspection JSUnusedGlobalSymbols
export type IssueEventTypeName = keyof IssueEventType

// noinspection JSUnusedGlobalSymbols
export const IssueEventTypeNameMap = convertEnumValuesToString(IssueEventType)

export type UIIssueEventTypes =
	"assigned" |
	//"closed" |
	"demilestoned" |
	"labeled" |
	//"mentioned" |
	//"merged" |
	"milestoned" |
	//"renamed" |
	//"referenced" |
	//"marked_as_duplicate" |
	"unlabeled" |
  "unassigned"
	//"reopened" |
	//"unmarked"



export type IssueEventTimelineItemType = "comment" | "activity"

export type IssueEventTimelineItemPayloadType<K extends IssueEventTimelineItemType> = K extends "activity" ? IIssueEvent : IComment

export interface IIssueEventTimelineItem<K extends IssueEventTimelineItemType = any, P = IssueEventTimelineItemPayloadType<K>> {
  type: K
  timestamp: number
  payload: IssueEventTimelineItemPayloadType<K>
}

export interface IIssueEventData {
  events: Array<IIssueEvent>
  comments: Array<IComment>
  timeline: Array<IIssueEventTimelineItem>
}
