import {IDialog} from "renderer/models/Dialog"
import {createSelector, OutputSelector} from "reselect"
import {DataState} from "common/store/state/DataState"
import {IDataSet, makeDataSet} from "common/Types"
import {ISearchChip, ISearchChipData, SearchProvider} from "renderer/search/Search"
import Dexie from "dexie"
import db from "renderer/db/ObjectDatabase"
import {IIssue} from "common/models/Issue"
import issueSearchProvider from "renderer/search/SearchIssues"
import getLogger from "common/log/Logger"
import * as _ from 'lodash'
import {ILayoutConfig} from "renderer/store/state/UIState"

const log = getLogger(__filename)

export const dialogsSelector = (state:IRootRendererState):Array<IDialog> => state.UIState.dialogs

export const currentDialogSelector =  (state:IRootRendererState):IDialog | null =>
  _.last(dialogsSelector(state))


export type SearchChipSelector = OutputSelector<IRootRendererState, Array<ISearchChip>, (res: {[id:string]:Array<ISearchChipData>}) => Array<ISearchChip>>


export const layoutsSelector = createSelector(
  (state:IRootRendererState):Array<ILayoutConfig> => state.UIState.layouts,
  (layouts:Array<ILayoutConfig>):Array<ILayoutConfig> =>
    layouts.sortBy(layout => layout.name)
)




export const currentIssueLayoutIdSelector = (state:IRootRendererState):string | null => state.UIState.currentLayoutId

export const currentLayoutSelector = createSelector(
  layoutsSelector,
  currentIssueLayoutIdSelector,
  (layouts:Array<ILayoutConfig>, currentId:string | null):ILayoutConfig | null =>
    layouts.find(layout => layout.id === currentId)
)

//   <
//   T = any,
//   PK = any,
//   DB extends Dexie = typeof db,
//   TableName extends keyof DB = DB[TableName] extends IDataSet<T> ? TableName : never,
//   P extends SearchProvider<DB, TableName,T,PK,any> = SearchProvider<DB, TableName,T,PK,any>
// >(
//   id: string,
//   tableName:TableName,
//   provider:P
// ):
export const layoutSearchChipSelector = createSelector(
    currentLayoutSelector,
    (layout: ILayoutConfig | null):Array<ISearchChip> => {
      if (!layout)
        return []


      return issueSearchProvider.hydrate(layout.searchChips)
    }

  )


// eslint-disable-next-line typescript/explicit-function-return-type
export function makeSearchDatasetSelector<
  T,
  PK,
  DB extends Dexie,
  TableName extends keyof DB,
  DataSetName extends Exclude<keyof DataState,"toJS">,
  P extends SearchProvider<DB, TableName,T,PK,any> = SearchProvider<DB, TableName,T,PK,any>
>(
  searchChipSelector:((state:IRootRendererState) => Array<ISearchChip>),
  dataSetName:DataSetName,
  provider:P
) {
  return createSelector(
    searchChipSelector,
    (state:IRootRendererState) => state.DataState[dataSetName] as any,
    (searchChips: Array<ISearchChip>, dataSet:IDataSet<T>):IDataSet<T> => {
      const finalItems = provider.filter(searchChips,dataSet.data)
      return makeDataSet(finalItems) as IDataSet<T>

    }

  )
}


export const searchIssuesKey = "search-issues"

//export const searchIssuesChipsSelector = makeSearchChipsSelector(searchIssuesKey,"issues",issueSearchProvider)

export const currentLayoutDataSetSelector =
  makeSearchDatasetSelector<IIssue,number,typeof db,"issues","issues",typeof issueSearchProvider>(
    layoutSearchChipSelector,
    "issues",
    issueSearchProvider
  )
