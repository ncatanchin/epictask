import * as React from "react"
import {useCallback, useRef, useState} from "react"
import getLogger from "common/log/Logger"
import {
  Fill,
  IThemedProperties,
  makeTransition,
  mergeClasses,
  PositionAbsolute,
  PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {guard} from "typeguard"

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
  ref?: React.RefObject<HTMLElement>
}


export default StyledComponent<P>(baseStyles)(React.forwardRef((props: P,ref:React.RefObject<any>): React.ReactElement<P> => {
  const
    {classes,children,onFocus:onParentFocus,onBlur:onParentBlur,className,...other} = props,
    containerRef = useRef<HTMLDivElement | null>(null),
    [focused, setFocused] = useState(false),
    onFocus = useCallback((event:React.FocusEvent) => {
      setFocused(true)
      guard(() => onParentFocus(event))
    },[onParentFocus,focused, setFocused]),
    onBlur = useCallback((event:React.FocusEvent) => {
      setFocused(false)
      guard(() => onParentBlur(event))
    },[onParentBlur,focused, setFocused])

  return <div ref={ref as any} onFocus={onFocus} onBlur={onBlur} className={mergeClasses(classes.root,className)} {...other}>
    {children}
    <div className={mergeClasses(classes.focused, focused && "active")}/>
  </div>
}))
