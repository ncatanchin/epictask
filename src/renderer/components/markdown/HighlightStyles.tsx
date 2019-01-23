import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, StyleDeclaration, withStatefulStyles, NestedStyles} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {

  return {
    "@global": theme.highlightjs
  }
}

interface P extends IThemedProperties {

}


const selectors = {}

export default StyledComponent<P>(baseStyles, selectors)(function HighlightStyles(props: P): React.ReactElement<P> {
  return <div/>
})
