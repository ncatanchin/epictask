
import {IThemedProperties, withStatefulStyles} from "renderer/styles/ThemedStyles"
import * as React from "react"
import baseStyles from "./SplitPane.styles"
import getLogger from "common/log/Logger"
import {hot} from "react-hot-loader"

const
  log = getLogger(__filename),
  SplitPane = require("react-split-pane")

export interface IVerticalSplitPaneProps extends IThemedProperties {
  defaultSize?: number|string
  minSize?: number|string
  primary?: "first"|"second"
  onChange?: (event:any) => any
}

/**
 * State
 */
export interface IVerticalSplitPaneState {}

/**
 * App Navigation
 */
@hot(module)
@withStatefulStyles(baseStyles)
export class VerticalSplitPane extends React.Component<IVerticalSplitPaneProps, IVerticalSplitPaneState> {
  
  constructor(props,context) {
    super(props,context)
  }
  
  render() {
    const {classes, children,...other} = this.props
    
    return <SplitPane
      {...other}
      className={classes.root}
      resizerClassName={classes.resizer}
      paneClassName={classes.pane}
      pane1ClassName={classes.pane1}
      pane2ClassName={classes.pane2}
      split="vertical"
    >
      {children}
    </SplitPane>
  }
}
