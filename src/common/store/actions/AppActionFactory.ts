import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {AppState} from "common/store/state/AppState"
import {IConfig} from "common/config/Config"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import {IUser} from "common/models/User"
import {IRepo} from "common/models/Repo"
import {IOrg} from "common/models/Org"
import * as _ from 'lodash'
import {DataType, IDataSyncStatus} from "common/Types"
import {IAppStatus, IAppStatusMessage, IAppStatusNotification, INetworkCall} from "common/models/AppStatus"
import {getValue, isFunction} from "typeguard"

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<AppState, ActionMessage<AppState>> implements IActionFactoryBase<AppState> {

  constructor() {
    super(AppState)
  }

  leaf(): string {
    return AppState.Key
  }

  @ActionReducer()
  setZoom(zoom:number) {
    return (state:AppState) => patchState(state,{
      zoom: Math.max(0.75,Math.min(2.5,zoom))
    })
  }


  /**
   * Zoom by an increment
   *
   * @param increment
   * @returns {any}
   */
  zoom(increment:number) {
    return this.setZoom(this.state.zoom + increment)
  }

  @ActionReducer()
  setSelectedNotificationIds(selectedNotificationIds:Array<string>) {
    return (state:AppState) => patchState(state,{
      selectedNotificationIds
    })
  }

  setSelectedRepo(selectedRepo: IRepo) {
    this.setSelectedRepoId(selectedRepo ? selectedRepo.id : 0)
  }

  setSelectedOrg(selectedOrg: IOrg) {
    this.setSelectedOrgId(selectedOrg ? selectedOrg.id : 0)
  }

  @ActionReducer()
  setSelectedRepoId(selectedRepoId: number) {
    return (state: AppState) => patchState(state, {
      selectedRepoId,
      enabledRepoIds: state.enabledRepoIds.includes(selectedRepoId) ?
        state.enabledRepoIds :
        [...state.enabledRepoIds,selectedRepoId]
    })
  }

  @ActionReducer()
  setSelectedOrgId(selectedOrgId: number) {
    return (state: AppState) => patchState(state, {
      selectedOrgId
    })
  }


  @ActionReducer()
  enableRepo(repo: IRepo) {
    return (state: AppState) => patchState(state, {
      enabledRepoIds: _.uniq([...state.enabledRepoIds, repo.id])
    })
  }

  @ActionReducer()
  setConfig(config: IConfig) {
    return (state: AppState) => patchState(state, {config})
  }

  @ActionReducer()
  setUser(user: IUser) {
    return (state: AppState) => patchState(state, {user})
  }

  @ActionReducer()
  setUserAndConfig(user: IUser, config: IConfig) {
    return (state: AppState) => patchState(state, {user, config})
  }

  @ActionReducer()
  setSelectedIssueIds(selectedIssueIds: Array<number>) {
    return (state: AppState) => patchState(state, {selectedIssueIds})
  }

  @ActionReducer()
  setState(newState: AppState) {
    return (state: AppState) => patchState(state, newState)
  }


  private internalUpdateNotifications(status: IAppStatus, msg: IAppStatusNotification, remove: boolean): IAppStatus {
    status = {...status}

    let notifications = status.notifications = [...status.notifications]

    if (remove) {
      notifications = notifications.filter(it => it.id !== msg.id)
    } else {
      const index = notifications.findIndex(it => it.id === msg.id)
      if (index === -1) {
        notifications = [msg, ...notifications]
      } else {
        notifications[index] = {...msg}
      }
    }

    status.notifications = notifications
    return status
  }


  private internalUpdateMessages(status: IAppStatus, msg: IAppStatusMessage, remove: boolean): IAppStatus {
    status = {...status}

    let history = status.history = [...status.history]

    if (remove) {
      history = history.filter(it => it.id !== msg.id)
      if (getValue(() => status.message.id === msg.id) && history.length) {
        status.message = {...history[0]}
      }
    } else {
      const index = history.findIndex(it => it.id === msg.id)
      if (index === -1) {
        history = [msg, ...history]
      } else {
        history[index] = {...msg}
      }
      if (index === -1 || getValue(() => status.message.id === msg.id) && history.length) {
        status.message = {...msg}
      }
    }

    if (history.length > 100)
      history = history.slice(0,100)

    status.history = history
    return status
  }

  @ActionReducer()
  updateAppStatusMessage(msg: IAppStatusMessage, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateMessages(state.status, msg, remove)
    })

  }

  @ActionReducer()
  updateAppStatusNotification(notification: IAppStatusNotification, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateNotifications(state.status, notification, remove)
    })

  }

  @ActionReducer()
  updateAppStatusMessageAndNotification(msg: IAppStatusNotification, notification: IAppStatusNotification, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateNotifications(
        this.internalUpdateMessages(state.status,msg,remove),
        notification,
        remove
      )
    })
  }


  @ActionReducer()
  updateAppStatus(status:Partial<IAppStatus> | ((state:AppState) => Partial<IAppStatus>)) {
    return (state: AppState) => patchState(state, {
      status: {
        ...state.status,
        ...isFunction(status) ? status(state) : status
      }
    })
  }

  @ActionReducer()
  updateNetworkCall(networkCall: INetworkCall, remove: boolean = false) {
    return (state: AppState) => {
      const
        status = {...state.status},
        network = status.network = {...status.network}

      let pending = [...network.pending]
      if (remove) {
        pending = pending.filter(it => it.id !== networkCall.id)
      } else {
        const index = pending.findIndex(it => it.id === networkCall.id)
        if (index === -1)
          pending.push(networkCall)
        else
          pending[index] = {...networkCall}
      }

      network.pending = pending

      return patchState(state, {
        status
      })
    }
  }

  @ActionReducer()
  setDataSynced(type: DataType, ids: Array<number>, syncedAt: number) {
    return (state: AppState) => {
      const
        syncs = {...state.syncs},
        status = {...(syncs[type] || {type, records: {}})} as IDataSyncStatus

      status.records = {...status.records}
      ids.forEach(id => {
        status.records[id] = {id, type, timestamp: syncedAt}
      })

      syncs[type] = status

      return patchState(state, {
        syncs
      })
    }
  }

}
