import getLogger from "common/log/Logger"
import {State} from "typedux"
import IssueViewController from "renderer/controllers/IssueViewController"
import {IDialog} from "renderer/models/Dialog"
import {ISearchChip, ISearchChipData} from "renderer/search/Search"

const log = getLogger(__filename)

/**
 *  UIState
 */

export class UIState implements State<string> {

  static Key = 'UIState'

  type = UIState.Key

  constructor(o: any = {}) {
    Object.assign(this, o)
  }

  issueViewController:IssueViewController | null = null

  dialogs:Array<IDialog> = []

  notificationsOpen:boolean = false

  splitters = {
    notifications: 300 as string|number,
    issues: 300 as string|number
  }

  searches: {
    [id:string]: Array<ISearchChipData>
  } = {}

  /**
   * To plain JS object
   *
   * @returns {any}
   */
  toJS() {
    return {
      ...this,
      issueViewController: null,
      dialogs: []
    }
  }

}

export default UIState
