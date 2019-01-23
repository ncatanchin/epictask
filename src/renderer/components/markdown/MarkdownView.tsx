

import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, makeMarginRem, NestedStyles, rem} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

import CodeBlock from "renderer/components/markdown/renderers/CodeBlock"
import ReactMarkdown from "react-markdown"

const log = getLogger(__filename)


function baseStyles(theme: Theme): NestedStyles {
  return {
    root: [makeMarginRem(0, 0), {
      "& p": {
        marginBlockStart: rem(0.5),
        marginBlockEnd: rem(0.5)
      }
    }]
  }
}

interface P extends IThemedProperties {
  source: string
}


export default StyledComponent<P>(baseStyles)(function MarkdownView(props: P): React.ReactElement<P> {
  const {classes, source, ...other} = props

  return <ReactMarkdown
    source={source}
    renderers={{
      ...ReactMarkdown.renderers,
      code: CodeBlock
    }}
    className={classes.root}
    {...other}
  />
})
