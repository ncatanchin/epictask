import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, NestedStyles, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: []
  }
}

interface P extends IThemedProperties {

}

interface SP {
}

const selectors = {} as Selectors<P, SP>

export default StyledComponent<P, SP>(baseStyles, selectors)(function Notifications(props: SP & P): React.ReactElement<P> {
  const {classes} = props
  return <div className={classes.root}/>
})
