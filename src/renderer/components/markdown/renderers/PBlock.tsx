import * as React from "react"
import {useRef} from "react"
import getLogger from "common/log/Logger"
import {IThemedProperties} from "renderer/styles/ThemedStyles"

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



  const source = literal || value
  //replace(/ /g,"&nbsp;")
  const lines = source.split("\n")
  const html = lines
    .map((line,index) =>
      `<span>${line.replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;")}</span>${index < lines.length - 1 ? "<br/>" : ""}`)
    .join("")

  //log.info("p ", {source,html,children,hasTab: source.includes("\t")})
  //_.isEmpty(source && source.trim()) ? <span/> :
  return <span dangerouslySetInnerHTML={{ __html:html}}/>

}
