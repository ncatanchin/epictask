import {ActivityListNotificationsResponseItem} from "@octokit/rest"
import {IconKey, IconType, IIcon, makeMUIIcon, makeOcticonIcon} from "common/models/Icon"

export enum NotificationType {
  Github = "Github",
  Internal = "Internal"
}

export interface INotificationInternal {

}

export type NotificationPayload<Type extends NotificationType> =
  Type extends NotificationType.Github ? ActivityListNotificationsResponseItem : INotificationInternal

export interface INotification<Type extends NotificationType = any> {
  id:string
  type:Type
  reason: NotificationReason
  icon: IIcon<Type extends NotificationType.Github ? IconType.Octicon : IconType.MUI>
  repo_full_name:string | null
  repo_id:number | null
  read:boolean
  updated_at:number
  payload:NotificationPayload<Type>
}

export const NotificationIndexes = {
  v1: "id,read,title,body,repo_full_name,updated_at"
}


export enum NotificationReason {
  info = "info",
  error = "error",
  assign = "assign",//	You were assigned to the Issue.
  author = "author",//	You created the thread.
  comment = "comment",//	You commented on the thread.
  invitation = "invitation",//	You accepted an invitation to contribute to the repository.
  manual = "manual",//	You subscribed to the thread (via an Issue or Pull Request).
  mention = "mention",//	You were specifically @mentioned in the content.
  state_change = "state_change",//	You changed the thread state (for example, closing an Issue or merging a Pull Request).
  subscribed = "subscribed",//	You're watching the repository.
  team_mention = "team_mention"//	You were on a team that was mentioned.
}



export const NotificationReasonIcons: {[Reason in NotificationReason]:IIcon<any>} = {
  info: makeMUIIcon("Info"),
  error: makeMUIIcon("Error"),
  assign: makeOcticonIcon("Person"),
  author: makeOcticonIcon("Person"),
  comment: makeOcticonIcon("CommentDiscussion"),
  invitation: makeOcticonIcon("Person"),
  manual: makeOcticonIcon("Watch"),
  mention: makeOcticonIcon("Mention"),
  state_change: makeOcticonIcon("IssueOpened"),
  subscribed: makeOcticonIcon("Watch"),
  team_mention: makeOcticonIcon("Mention")
}
