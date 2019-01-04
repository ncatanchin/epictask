import * as React from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  IThemedProperties,
  PositionRelative,
  StyleDeclaration,
  withStatefulStyles
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import ContainerDimensions from "renderer/components/elements/IssueList"
import { AutoSizer as VAutoSizer, List as VList, ListProps as VListProps, ListRowRenderer as VListRowRenderer } from 'react-virtualized'
import {IDataSet, Omit} from "common/Types"
import {
  CommandComponent,
  CommandContainerBuilder, filterCommandProps, getCommandProps,
  ICommandComponentProps,
  TCommandItemsCreator
} from "renderer/command-manager-ui"
import {StyledComponentProps} from "@material-ui/core"

const log = getLogger(__filename)


function baseStyles(theme):any {
  const
    {palette} = theme,
    {primary, secondary} = palette
  
  return {
    root: [Fill,PositionRelative]
  }
}

interface P<T> extends StyledComponentProps<string>,ICommandComponentProps,Omit<VListProps,"rowCount"> {
  dataSet:IDataSet<T>
  id:string
}

interface S {

}

@withStatefulStyles(baseStyles)
@CommandComponent()
export default class List<T = any> extends React.Component<P<T>, S> {
  
  constructor(props:P<T>,context) {
    super(props,context)
    
    this.state = {}
  }
  
  commandItems = (builder:CommandContainerBuilder) =>
    builder.make()
  
  commandComponentId = this.props.id
  
  render() {
    const {id,classes,rowRenderer,dataSet,rowHeight,...other} = this.props
    return <div id={id} className={classes.root} {...getCommandProps(this)}>
      {dataSet.total > 0 &&
      <VAutoSizer>
        {({width,height}) => <VList
          height={height}
          width={width}
          rowCount={dataSet.total}
          rowHeight={rowHeight}
          rowRenderer={rowRenderer}
        />}
      </VAutoSizer>}
    </div>
  }
}
