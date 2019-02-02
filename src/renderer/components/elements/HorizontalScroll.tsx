import * as React from "react"
import getLogger from "common/log/Logger"
import {
  IThemedProperties,
  StyleDeclaration,
  withStatefulStyles,
  NestedStyles,
  PositionRelative, PositionAbsolute, FillHeight
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {StyledComponent} from "renderer/components/elements/StyledComponent"
import {CSSProperties, useEffect, useRef} from "react"
import * as CSS from 'csstype'
import {LineWidth} from "csstype"
import * as $ from 'jquery'

const log = getLogger(__filename)


function baseStyles(theme: Theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  function makeFadeBg(side:"left" | "right"):(props:P) => string {
    return ({shadow}:P) => {
      const grad = `-webkit-linear-gradient(${side}, ${shadow.from}, ${shadow.to})`
      //log.info("Grad", grad)
      return grad
    }
  }

  return {
    container: [{
      "&::before": [FillHeight,PositionAbsolute,{
        width: (props:P) => props.shadow.length,
        top: 0,
        left:0,
        bottom: 0,
        zIndex: 1,
        content: "' '",
        background: makeFadeBg("left")
      }],
      "&::after": [FillHeight,PositionAbsolute,{
        width: (props:P) => props.shadow.length,
        top: 0,
        bottom: 0,
        right:0,//(props:P) => props.shadow.length,//`calc(100% - ${props.shadow.length})`,
        zIndex: 1,
        content: "' '",
        background: makeFadeBg("right")
      }]
    }],
    root: [PositionRelative,{

    }]
  }
}

interface P<E = any> {
  classes: any
  shadow: {
    from: CSS.Color
    to: CSS.Color
    length: LineWidth<any> | string
  }
  selector?: string | null
  children: (containerRef:React.RefObject<E | null>) => any//Element | HTMLElement | React.ReactNode | null //| React.ReactElement<any>
}


export default StyledComponent(baseStyles)(function HorizontalScroll<E extends Element = any>(props: P<E>): React.ReactElement<P<E>> {
  const
    {children,selector,classes} = props,
    containerRef = useRef<any>(null)

  useEffect(() => {
    const parent = containerRef.current as HTMLElement
    if (!parent)
      return null

    let elem = parent
    if (selector) {
      elem = parent.querySelector(selector)
    }
    //log.info("Updating container", selector,parent,elem)

    const onScroll = (event:UIEvent):void => {
      log.info("On scroll", event, elem.clientWidth, elem.scrollWidth, elem.scrollLeft)
    }

    const clazz = classes.container
    $(elem).addClass(clazz)
    elem.addEventListener("scroll",onScroll)

    return () => {
      $(elem).removeClass(clazz)
      elem.removeEventListener("scroll",onScroll)
    }
  },[containerRef.current])

  return children(containerRef) as any
})  //as (props: P) => (Element | React.ReactNode | React.ReactElement<P>)
