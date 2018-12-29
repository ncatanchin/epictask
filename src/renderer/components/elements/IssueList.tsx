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
import {IIssue} from "renderer/models/Issue"
import {IDataSet} from "common/Types"
import { List,ListRowRenderer } from 'react-virtualized'
import IssueListItem from "renderer/components/elements/IssueListItem"
const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [Fill,PositionRelative],
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
    const {classes,issues} = this.props
    return <div className={classes.root}>
      <ContainerDimensions>
        {({width,height}) => <List
          height={height}
          width={width}
          rowCount={issues.total}
          rowHeight={75}
          rowRenderer={this.rowRenderer}
        >
        
        </List>}
      </ContainerDimensions>
    </div>
  }
}
