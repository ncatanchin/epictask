
import * as React from "react"
import {
  AppStatusMessageContent,
  AppStatusMessageType, AppStatusNotificationDurations,
  IAppStatusMessage,
  IAppStatusNotification, IAppStatusNotificationAction, IAppStatusWork, isAppStatusMessageContent
} from "common/models/AppStatus"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {shortId} from "common/IdUtil"
import Deferred from "common/Deferred"

export function pushStatusMessage(msg:IAppStatusMessage):void {
  new AppActionFactory().updateAppStatusMessage(msg)
}


export function setStatusMessage(msg:IAppStatusMessage)
export function setStatusMessage(
  content:AppStatusMessageContent,
  type?:AppStatusMessageType,
  notificationId?:string
)

/**
 * Update/set global status message
 *
 * @param content
 * @param typeOrNull
 * @param notificationIdOrNull
 */
export function setStatusMessage(
  content:AppStatusMessageContent,
  typeOrNull:AppStatusMessageType | null = AppStatusMessageType.Info,
  notificationIdOrNull:string | null = null
):void {

  const msg = (isAppStatusMessageContent(content)) ?
    makeStatusMessage(content,typeOrNull,notificationIdOrNull) :
    content

  pushStatusMessage(msg)
}

export function removeStatusMessage(msg:IAppStatusMessage):void {
  new AppActionFactory().updateAppStatusMessage(msg, true)
}

/**
 * Create an app status message
 *
 * @param content
 * @param type
 * @param notificationId
 * @return {{id: string, content: AppStatusMessageContent, timestamp: number, type: AppStatusMessageType}}
 */
export function makeStatusMessage(
  content:AppStatusMessageContent,
  type:AppStatusMessageType = AppStatusMessageType.Info,
  notificationId:string = null
):IAppStatusMessage {
  return {
    id: shortId(),
    content,
    timestamp: Date.now(),
    type,
    notificationId
  }
}


export function makeStatusNotification(
  content:AppStatusMessageContent,
  type:AppStatusMessageType = AppStatusMessageType.Info,
  duration:number = AppStatusNotificationDurations.Short,
  action:IAppStatusNotificationAction | null = null
):IAppStatusNotification {
  return {
    id: shortId(),
    content,
    timestamp: Date.now(),
    type,
    duration,
    action
  }
}


export function makeBlockingWork<T = any>(
  content:AppStatusMessageContent,
  deferred:Deferred<T> = new Deferred<T>(),
  type:AppStatusMessageType = AppStatusMessageType.Info
):IAppStatusWork<T> {
  return {
    id: shortId(),
    content,
    timestamp: Date.now(),
    type,
    deferred
  }
}
