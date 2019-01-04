import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill, FillHeight,
  FlexRowCenter,
  IThemedProperties, PositionRelative,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import ContainerDimensions from 'react-container-dimensions'
import {IIssue} from "common/models/Issue"
import {IDataSet} from "common/Types"
import { ListRowRenderer } from 'react-virtualized'
import IssueListItem from "renderer/components/elements/IssueListItem"
import List from "renderer/components/elements/List"
const log = getLogger(__filename)


function baseStyles(theme:Theme):StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [Fill,PositionRelative,{
    
    }],
    issue: [FlexRowCenter, FillHeight,{
    
    }]
  }
}

interface P extends IThemedProperties {
  issues?: IDataSet<IIssue>
}

interface S {

}

@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({
  issues: (state:IRootState) => state.DataState.issues
}))
export default class IssueList extends React.Component<P, S> {
  
  constructor(props:P) {
    super(props)
    
    this.state = {}
  }
  
  private rowRenderer:ListRowRenderer = ({
    key,
    index,
    isScrolling,
    isVisible,
    style
  }) => {
    const
      {issues,classes} = this.props,
      issue = issues.data[index]
    
    return <IssueListItem
      key={key}
      style={style}
      issue={issue}
    />
    
    
  }
  
  render() {
    const {classes,issues,...other} = this.props
    return <List
      id="issues-list"
      // classes={{
      //   root: classes.root
      // }}
      dataSet={issues}
      rowRenderer={this.rowRenderer}
      rowHeight={70}
      {...other as any}
    />
  }
}
