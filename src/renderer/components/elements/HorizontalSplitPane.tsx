
import {IThemedProperties, mergeStyles, withStatefulStyles} from "renderer/styles/ThemedStyles"
import * as React from "react"
import {connect} from "common/util/ReduxConnect"
import {createStructuredSelector} from "reselect"
import baseStyles from "./SplitPane.styles"

const SplitPane = require("react-split-pane").default

export interface IHorizontalSplitPaneProps extends IThemedProperties {
  defaultSize?: number|string
  minSize?: number|string
  primary?: "first"|"second"
  onChange?: (event:any) => any
}

/**
 * State
 */
export interface IHorizontalSplitPaneState {}

/**
 * App Navigation
 */
@withStatefulStyles(baseStyles)
@connect(createStructuredSelector({}))
export class HorizontalSplitPane extends React.Component<IHorizontalSplitPaneProps, IHorizontalSplitPaneState> {
  
  render() {
    const {classes, children,...other} = this.props
    
    return <SplitPane
      className={classes.root}
      resizerClassName={classes.resizer}
      paneClassName={classes.pane}
      pane1ClassName={classes.pane1}
      pane2ClassName={classes.pane2}
      split="horizontal"
      {...other}
    >
      {children}
    </SplitPane>
  }
}
