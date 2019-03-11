import * as React from "react"
import {useCallback} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  FillWidth,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  makeTransition,
  OverflowHidden,
  PositionAbsolute,
  PositionRelative, remToPx,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {IIssue} from "common/models/Issue"
import {IDataSet} from "common/Types"
import IssueListItem from "renderer/components/elements/IssueListItem"
import List, {ListRowProps} from "renderer/components/elements/List"
import {getValue} from "typeguard"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {selectedIssueIdsSelector} from "common/store/selectors/AppSelectors"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import {makeCommandManagerAutoFocus} from "common/command-manager"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import CommonElementIds from "renderer/CommonElements"
import IssueViewController from "renderer/controllers/IssueViewController"
import {ISearchChip} from "renderer/search/Search"
import {
  currentLayoutDataSetSelector
} from "renderer/store/selectors/UISelectors"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"

const log = getLogger(__filename)

const commandManagerOptions = {
  tabIndex: -1,
  autoFocus: makeCommandManagerAutoFocus(50)
}

type Classes = "root" | "focused" | "list" | "search"

function baseStyles(theme: Theme): StyleDeclaration<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {
      ...Fill,
      ...PositionRelative,
      ...FlexColumn,
      ...OverflowHidden
    },
    list: {
      ...FlexScale,
      ...FillWidth,
      maxHeight: "auto",
      height: "auto",
      minHeight: 0,
      overflowY: "hidden",
      overflowX: "hidden"
    },
    search: {
      //...FlexAuto,
      ...FillWidth
    },
    focused: {
      ...makeTransition('box-shadow'),
      ...Fill,
      ...PositionAbsolute,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      boxShadow: "none",
      "&.active": {
        ...theme.focus
      }
    }
  }
}



interface P extends IThemedProperties {

}

interface SP {
  sortedIssues: IDataSet<IIssue>
  selectedIssueIds: Array<number>
  controller: IssueViewController | null
}

export default StyledComponent<P,SP>(baseStyles,{
  sortedIssues: currentLayoutDataSetSelector,
  selectedIssueIds: selectedIssueIdsSelector,
  controller: (state:IRootRendererState) => state.UIState.issueViewController
})(function IssueList(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, controller, selectedIssueIds, sortedIssues, ...other} = props,
    id = CommonElementIds.IssueList,
    makeSelectedIndexes = ():Array<number> => selectedIssueIds
      .map(id => sortedIssues.data.findIndex(issue => issue.id === id) as number)
      .filter(index => index !== -1)
      .sort(),
    selectedIndexes = makeSelectedIndexes()


  const rowRenderer = useCallback((rowProps: ListRowProps): React.ReactNode => {
    const
      {
        key,
        index,
        onClick,
        style,
        dataSet,
        selectedIndexesContext
      } = rowProps,
      issue = dataSet.data[index],
      Consumer = getValue(() => selectedIndexesContext.Consumer, null as React.Consumer<Array<number>> | null)


    return !Consumer ? <div
      key={key}
      style={style}
    /> : <Consumer key={key}>
      {(selectedIndexes: Array<number> | null) => <IssueListItem
        style={style}
        issue={issue}
        onClick={onClick}
        selected={selectedIndexes && selectedIndexes.includes(index)}
      />}
    </Consumer>


  },[])



  const

    updateSelectedIssues = useCallback(async (dataSet: IDataSet<IIssue>,indexes:Array<number>):Promise<void> => {
      const
        {data} = dataSet,
        ids = indexes.map(index => getValue(() => data[index].id)).filter(id => !!id)
      new AppActionFactory().setSelectedIssueIds(ids)
    },[controller]),

    onSearchChipsChanged = useCallback((newSearchChips:Array<ISearchChip<IIssue,number,any>>) => {
      new UIActionFactory().updateLayoutSearchChips(newSearchChips)
    },[])

  return <FocusedDiv classes={{root:classes.root}}>
    <List
    id={id}
    dataSet={sortedIssues}
    commandManagerOptions={commandManagerOptions}
    onSelectedIndexesChanged={updateSelectedIssues}
    selectedIndexes={selectedIndexes}
    rowRenderer={rowRenderer}
    rowHeight={remToPx(6)}
    classes={{
      root: classes.list
    }}
    {...other as any}
  />
  </FocusedDiv>

})
