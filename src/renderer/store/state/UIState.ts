import getLogger from "common/log/Logger"
import {State} from "typedux"
import IssueViewController from "renderer/controllers/IssueViewController"
import {IDialog} from "renderer/models/Dialog"
import {ISearchChip, ISearchChipData, OrderByChip, SortChip, SortFilter} from "renderer/search/Search"
import {StringMap} from "common/Types"
import {convertEnumValuesToString} from "common/ObjectUtil"
import {shortId} from "common/IdUtil"

const log = getLogger(__filename)

export enum SearchType {
  Issues
}

export const SearchTypeMap = convertEnumValuesToString(SearchType)

type SearchTypes = keyof typeof SearchTypeMap

export const DefaultSearchChips:{[key in SearchTypes]:Array<ISearchChip>} = {
  Issues: [new SortChip(this, 'sort', "Descending", false)]
}

export interface ILayoutConfig {
  id:string
  name:string
  repoIds:Array<number>
  searchChips:Array<ISearchChipData>
}


export function makeIssueLayoutConfig(name:string, repoIds: Array<number> = [], searchChips:Array<ISearchChipData> = []):ILayoutConfig {
  return {
    id: shortId(),
    name,
    repoIds,
    searchChips
  }
}

/**
 *  UIState
 */

export class UIState implements State<string> {

  static Key = 'UIState'

  static fromJS(o:any = {}):UIState {
    return new UIState(o)
  }

  type = UIState.Key


  issueViewController:IssueViewController | null = null

  dialogs:Array<IDialog> = []

  notificationsOpen:boolean = false

  splitters = {
    notifications: 300 as string|number,
    issues: 300 as string|number
  }

  layouts:Array<ILayoutConfig> = []

  currentLayoutId:string | null = null

  constructor(o: any = {}) {
    Object.assign(this, o)

    if (this.layouts.isEmpty())
      this.layouts = [makeIssueLayoutConfig("Layout 1")]

    if (!this.currentLayoutId) {
      this.currentLayoutId = this.layouts[0].id
    }
  }

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
