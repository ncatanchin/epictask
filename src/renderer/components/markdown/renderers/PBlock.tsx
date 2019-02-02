//import "highlight.js/styles/atom-one-dark.css"
// import "codemirror/lib/codemirror.css"
// import "codemirror/theme/darcula.css"

import * as React from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties, NestedStyles} from "renderer/styles/ThemedStyles"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import * as highlight from "highlight.js"
//import 'highlight.js/styles/github.css'
import {useEffect, useRef} from "react"
import * as _ from 'lodash'
const log = getLogger(__filename)



interface P extends IThemedProperties {
  literal: string
  value: string
  language: string
}


export default function EpicPBlock(props: P): React.ReactElement<P> {
  const
    codeRef = useRef<HTMLElement | null>(null),
    {language, children, literal,value} = props



  log.info("p ", literal,value,children)
  let source = literal || value
  if (source.indexOf("\n") > -1)
    source = `${source.replace(/\n/g, "<br/>").replace(/ /g,"&nbsp;")}`
  return _.isEmpty(source && source.trim()) ? <span/> :
    <span dangerouslySetInnerHTML={{ __html:source}}/>

}
