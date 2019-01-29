import * as React from "react"
import Deferred from "common/Deferred"

export interface IAppStatusProps {
  message?: IAppStatusMessage | null
  notification?: IAppStatusNotification | null
  work?: IAppStatusWork | null
}

export type AppStatusMessageContent = string | React.ReactNode | ((props:IAppStatusProps) => React.ReactElement<IAppStatusProps>)

export enum AppStatusMessageType {
  Info,
  Warn,
  Error
}

export interface IAppStatusMessage {
  id: string
  content: AppStatusMessageContent
  timestamp: number
  type:AppStatusMessageType
  notificationId?: string | null
}

export interface IAppStatusNotificationAction {
  content: AppStatusMessageContent
  fn: () => void
}

export interface IAppStatusWork<T = any> extends IAppStatusMessage {
  deferred:Deferred<T>
}

export interface IAppStatusNotification extends IAppStatusMessage {
  duration: number
  action?: IAppStatusNotificationAction | null
}
export interface IAppStatus {
  hidden: boolean
  message: IAppStatusMessage | null
  history: Array<IAppStatusMessage>
  network: INetworkStatus
  notifications: Array<IAppStatusNotification>
  blockingWork: Array<IAppStatusWork>
}

export interface INetworkCall {
  id: string
  url: string
  method: string
  from: string
  code: number
}

export interface INetworkStatus {
  pending: Array<INetworkCall>
}

export function makeDefaultAppStatus():IAppStatus {
  return {
    hidden: false,
    message: null,
    history: [],
    network: {
      pending: []
    },
    notifications: [],
    blockingWork: []
  }
}


export const AppStatusNotificationDurations = {
  Short: 4000
}
