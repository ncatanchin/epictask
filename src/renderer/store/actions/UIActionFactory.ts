import {ActionFactory, ActionReducer, ActionMessage, patchState} from "typedux"
import getLogger from "common/log/Logger"
import {ILayoutConfig, UIState} from "../state/UIState"
import IssueViewController from "renderer/controllers/IssueViewController"
import {getValue} from "typeguard"
import {DialogDefaults, IDialog} from "renderer/models/Dialog"
import {getCommandManager} from "common/command-manager"
import {ISearchChip} from "renderer/search/Search"
import * as _ from 'lodash'
import {AppState} from "common/store/state/AppState"

const
  log = getLogger(__filename)

export class UIActionFactory extends ActionFactory<UIState, ActionMessage<UIState>> {

  static ServiceName = "UIActions"

  static leaf = UIState.Key

  constructor() {
    super(UIState)
  }

  /**
   * Leaf name
   * @returns {string}
   */
  leaf(): string {
    return UIState.Key
  }


  private updateDialogCommandManager(state:UIState,dialog:IDialog | null = null) {
    const oldLength = getValue(() => state.dialogs.length,0)
    if (dialog && !oldLength) {
      getCommandManager().pushStack()
    } else if (!dialog && oldLength === 1) {
      getCommandManager().popStack()
    }
  }

  // @ActionReducer()
  // setNotificationsOpen(notificationsOpen:boolean) {
  //   return (state: UIState) => patchState(state,{
  //     notificationsOpen
  //   })
  // }

  @ActionReducer()
  setCurrentLayoutConfig(layout:ILayoutConfig) {
    return (state:UIState) => patchState(state,{
      currentLayoutId: layout.id
    })
  }

  @ActionReducer()
  showDialog(dialog:IDialog) {
    return (state:UIState) => {
      dialog = {...DialogDefaults, ...dialog}
      this.updateDialogCommandManager(state,dialog)
      return patchState(state,{
        dialogs: [...state.dialogs,dialog]
      })
  }}

  @ActionReducer()
  patchCurrentLayout(patch:Partial<ILayoutConfig>) {
    return (state: UIState) => {
      let layout = state.layouts.find(layout => layout.id === state.currentLayoutId)
      if (layout) {

        const
          layouts = [...state.layouts],
          index = layouts.findIndex(layout => layout.id === layout.id)

        if (index > -1) {
          layout = {...layout, ...patch}
          layouts[index] = layout
          return patchState(state, {
            layouts
          })
        }
      }
      return state

    }
  }


  updateLayoutSearchChips(chips:Array<ISearchChip>) {
    const data = chips.map(chip => chip.data())
    log.info("Setting chip data",data,chips)
    this.patchCurrentLayout({
      searchChips: data
    })

  }

  @ActionReducer()
  removeDialog({id}:IDialog) {
    return (state:UIState) => {
      this.updateDialogCommandManager(state)
      return patchState(state,{
        dialogs: [...state.dialogs.filter(dialog => dialog.id !== id)]
      })
    }
  }

  @ActionReducer()
  setIssueViewController(issueViewController:IssueViewController | null) {
    return (state:UIState) => getValue(() => _.isEqual(issueViewController,state.issueViewController),false) ?
      state :
      patchState(state, {
        issueViewController: issueViewController ? issueViewController : null
      })
  }

  @ActionReducer()
  setNotificationsOpen(notificationsOpen:boolean) {
    return (state:UIState) =>
      patchState(state, {
        notificationsOpen
      })
  }

  @ActionReducer()
  setSplitter(name:string, size: number | string) {
    return (state: UIState) => patchState(state, {
      splitters: {
        ...state.splitters,
        [name]: size
      }
    })
  }


  @ActionReducer()
  setState(newState:UIState) {
    return (state: UIState) => newState
  }

}
