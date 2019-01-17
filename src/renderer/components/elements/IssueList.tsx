import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FillHeight,
  FlexRowCenter,
  IThemedProperties, NestedStyles, PositionRelative
} from "renderer/styles/ThemedStyles"
import {IIssue} from "common/models/Issue"
import {IDataSet} from "common/Types"
import IssueListItem from "renderer/components/elements/IssueListItem"
import List, {ListRowProps} from "renderer/components/elements/List"
import {useEffect, useState} from "react"
import {getValue} from "typeguard"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {selectedIssueIdsSelector} from "common/store/selectors/AppSelectors"
import {AppActionFactory} from "common/store/actions/AppActionFactory"
import * as _ from 'lodash'

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [Fill, PositionRelative, {}],
    issue: [FlexRowCenter, FillHeight, {}]
  }
}

interface P extends IThemedProperties {
  issues?: IDataSet<IIssue>
  selectedIssueIds?: Array<number>
}

export default StyledComponent(baseStyles,{
  issues: (state: IRootState) => state.DataState.issues,
  selectedIssueIds: selectedIssueIdsSelector
})(function IssueList(props: P): React.ReactElement<P> {
  const
    {classes, selectedIssueIds, issues, ...other} = props,
    [selectedIndexes,setSelectedIndexes] = useState(Array<number>())

  useEffect(() => {
    const indexes = selectedIssueIds.map(id => issues.data.findIndex(issue => issue.id === id)).sort()

    if (!indexes.every(index => selectedIndexes.includes(index)))
      setSelectedIndexes(indexes)

  },[selectedIssueIds])


  function rowRenderer(rowProps: ListRowProps): React.ReactNode {
    const
      {
        key,
        index,
        onClick,
        style,
        selectedIndexesContext
      } = rowProps,
      {issues} = props,
      issue = issues.data[index],
      Consumer = getValue(() => selectedIndexesContext.Consumer, null as React.Consumer<Array<number>> | null)


    return !Consumer ? <div
      key={key}
      style={style}
    /> : <Consumer key={key}>
      {(selectedIndexes: Array<number> | null) => <IssueListItem
        style={style}
        issue={issue}
        index={index}
        onClick={onClick}
        selected={selectedIndexes && selectedIndexes.includes(index)}
      />}
    </Consumer>


  }

  const updateSelectedIssues = _.debounce((dataSet: IDataSet<IIssue>,indexes:Array<number>):void => {
    setImmediate(() => {
      const
        {data} = dataSet,
        ids = indexes.map(index => getValue(() => data[index].id)).filter(id => !!id)

      setSelectedIndexes(indexes)
      new AppActionFactory().setSelectedIssueIds(ids)
    })
  }, 350)


  return <List
    id="issues-list"
    dataSet={issues}
    onSelectedIndexesChanged={updateSelectedIssues}
    selectedIndexes={selectedIndexes}
    rowRenderer={rowRenderer}
    rowHeight={70}
    {...other as any}
  />

} as any)
