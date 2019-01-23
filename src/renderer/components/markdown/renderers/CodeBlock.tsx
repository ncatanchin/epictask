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

const log = getLogger(__filename)


function highlightCode(element:HTMLElement):void {
  highlight.highlightBlock(element);
}



interface P extends IThemedProperties {
  literal: string
  value: string
  language: string
}


export default function EpicCodeBlock(props: P): React.ReactElement<P> {
  const
    codeRef = useRef<HTMLElement | null>(null),
    {language, literal,value} = props


  //log.info("MD", this, props)
  useEffect(() => {
    if (!codeRef.current) return
    highlightCode(codeRef.current)
  },[codeRef])
  return <pre>
    <code ref={codeRef} className={language}>{literal || value}</code>
  </pre>
}
