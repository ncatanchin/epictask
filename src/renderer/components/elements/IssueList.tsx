import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FillHeight,
  FlexRowCenter,
  IThemedProperties, makeTransition, mergeClasses, NestedStyles, PositionAbsolute, PositionRelative
} from "renderer/styles/ThemedStyles"
import {IIssue} from "common/models/Issue"
import {IDataSet} from "common/Types"
import IssueListItem from "renderer/components/elements/IssueListItem"
import List, {ListRowProps} from "renderer/components/elements/List"
import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {getValue} from "typeguard"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {selectedIssueIdsSelector} from "common/store/selectors/AppSelectors"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import * as _ from 'lodash'
import {isEqual} from 'lodash'
import {makeCommandManagerAutoFocus} from "common/command-manager"
import {issuesSortedAndFilteredSelector} from "common/store/selectors/DataSelectors"
import {useFocused} from "renderer/command-manager-ui/CommandComponent"
import FocusedDiv from "renderer/components/elements/FocusedDiv"
import CommandContainerIds from "renderer/CommandContainers"

const log = getLogger(__filename)

const commandManagerOptions = {
  tabIndex: -1,
  autoFocus: makeCommandManagerAutoFocus(50)
}

function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [Fill, PositionRelative, {}],
    focused: [makeTransition('box-shadow'),Fill, PositionAbsolute, {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      boxShadow: "none",
      "&.active": [theme.focus]
    }]
  }
}



interface P extends IThemedProperties {

}

interface SP {
  sortedIssues: IDataSet<IIssue>
  selectedIssueIds: Array<number>
}

export default StyledComponent<P,SP>(baseStyles,{
  sortedIssues: issuesSortedAndFilteredSelector,
  selectedIssueIds: selectedIssueIdsSelector
})(function IssueList(props: P & SP): React.ReactElement<P & SP> {
  const
    {classes, selectedIssueIds, sortedIssues, ...other} = props,
    id = CommandContainerIds.IssueList,
    makeSelectedIndexes = ():Array<number> => selectedIssueIds
      .map(id => sortedIssues.data.findIndex(issue => issue.id === id) as number)
      .filter(index => index !== -1)
      .sort(),
    [selectedIndexes,setSelectedIndexes] = useState(makeSelectedIndexes)

  useEffect(() => {
    const indexes = makeSelectedIndexes()
    setSelectedIndexes(prevIndexes => isEqual(indexes,selectedIndexes) ? prevIndexes : indexes)
  },[sortedIssues,selectedIssueIds])


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


  },[selectedIndexes,selectedIssueIds])



  const updateSelectedIssues = useCallback((dataSet: IDataSet<IIssue>,indexes:Array<number>):void => {
    setImmediate(() => {
      const
        {data} = dataSet,
        ids = indexes.map(index => getValue(() => data[index].id)).filter(id => !!id)

      setSelectedIndexes(indexes)
      new AppActionFactory().setSelectedIssueIds(ids)
    })
  },[setSelectedIndexes])

  return <FocusedDiv classes={{root:classes.root}}>
    <List
    id={id}
    dataSet={sortedIssues}
    commandManagerOptions={commandManagerOptions}
    onSelectedIndexesChanged={updateSelectedIssues}
    selectedIndexes={selectedIndexes}
    rowRenderer={rowRenderer}
    rowHeight={70}
    {...other as any}
  />
  </FocusedDiv>

})
