import {ActionMessage, ObservableStore, State} from "typedux"
import {AppState} from "common/store/state/AppState"
import {DataState} from "common/store/state/DataState"
import {Store as ReduxStore} from "redux"
import {StringMap} from "common/Types"

declare global {

  interface IRootState extends State<string> {
    AppState:AppState
    DataState:DataState
  }

  type AppStoreLeafKey = keyof IRootState

  function getReduxStore():ReduxStore<IRootState>

  function getStore():ObservableStore<any>

  function getStoreState():StringMap<any> & IRootState

  interface Window {
    devToolsExtension:any
  }
}

export interface ISyncActionMessage extends ActionMessage<any> {
  windowId: number
  fromWindowId:string
  fromChildId: string
  fromServer: boolean
}

export const AppStoreSyncKeys:Array<AppStoreLeafKey> = [
  "AppState"
]

export const AppStoreLocalStoreKeys:Array<AppStoreLeafKey> = [
  "UIState"
]
