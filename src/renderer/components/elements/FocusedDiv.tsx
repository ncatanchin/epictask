import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  mergeClasses, Fill, PositionRelative, makeTransition, PositionAbsolute
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {useRef} from "react"
import {useFocused} from "renderer/command-manager-ui"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: [PositionRelative, {}],
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
  innerRef?: React.RefObject<HTMLDivElement>
}


export default StyledComponent<P>(baseStyles)(function FocusedDiv(props: P): React.ReactElement<P> {
  const
    {classes,children,...other} = props,
    containerRef = useRef<HTMLDivElement | null>(null),
    focused = useFocused(containerRef)

  return <div ref={containerRef} className={classes.root} {...other}>
    {children}
    <div className={mergeClasses(classes.focused, focused && "active")}/>
  </div>
})
