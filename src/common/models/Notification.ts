import {ActivityListNotificationsResponseItem} from "@octokit/rest"

export enum NotificationType {
  Github = "Github",
  Internal = "Internal"
}

export interface INotificationInternal {

}

export type NotificationPayload<Type extends NotificationType> =
  Type extends NotificationType.Github ? ActivityListNotificationsResponseItem : INotificationInternal

export interface INotification<Type extends NotificationType> {
  id:string
  type:Type
  read:boolean
  title:string
  body:string
  payload:NotificationPayload<Type>
}

export const NotificationIndexes = {
  v1: "id,read,title,body"
}
