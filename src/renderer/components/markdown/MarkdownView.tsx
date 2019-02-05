

import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, makeMarginRem, rem, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"

import CodeBlock from "renderer/components/markdown/renderers/CodeBlock"
import PBlock from "renderer/components/markdown/renderers/PBlock"
import * as ReactMarkdown from "react-markdown"
import "renderer/assets/css/markdown.github.scss"
import classNames from "classnames"
const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  return {
    root: [makeMarginRem(0, 0), {
      "& p": {
        marginBlockStart: rem(0.5),
        marginBlockEnd: rem(0.5)
      },
      "& li > span, & li > code": {
        lineHeight: 1.6
      },
      "& img": {
        maxWidth: "100%",
        objectFit: "contain"
      },
      // "& img": {
      //   maxWidth: "100%",
      //   objectFit: "contain"
      // }
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
      code: CodeBlock,
      text: PBlock
    }}
    className={classNames(classes.root,"markdown")}
    {...other}
  />
})
