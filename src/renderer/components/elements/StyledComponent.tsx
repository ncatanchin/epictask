import * as React from "react"
import getLogger from "common/log/Logger"
import {
  StyleCallback,
  StyleDeclaration,
  withStatefulStyles,
  WithStylesOptions
} from "renderer/styles/ThemedStyles"
import {createStructuredSelector, ParametricSelector, Selector} from "reselect"
import {connect} from "common/util/ReduxConnect"
import {guard, isFunction} from "typeguard"
import {StyleRules} from "@material-ui/core/styles"


const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme): StyleRules<Classes> {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: {}
  }
}

export type Selectors<Props = any,ReduxProps = any, State = IRootState> =
  {[K in keyof ReduxProps]: Selector<State, ReduxProps[K]>} |
  {[K in keyof ReduxProps]: ParametricSelector<State, ReduxProps & Props, ReduxProps[K]>}

export type ExtraComponentWrappers<P> = {
  inner?: Array<StyledWrapperComponentProducer<P>>,
  outer?: Array<StyledWrapperComponentProducer<P>>
}

export interface StyledComponentOptions<S = any,T = any,P = any,ST = any> extends WithStylesOptions<string> {
  extraWrappers?: ExtraComponentWrappers<P>
}


function isSelectors<T = any>(o:any):o is {[K in keyof T]: Function} {
  return o && Object.values(o).every(isFunction)
}

export type StyledElement<P = any> = React.ReactElement<P>
export type StyledComponentProducer<P = any> = (props:P) => StyledElement<P> //)// | React.ComponentClass<P,S> | ((...args:any[]) => React.ReactNode | React.ComponentClass<P,S>)
export type StyledWrapperComponentProducer<P = any> = (fn:StyledComponentProducer<P>) => StyledComponentProducer<P>

export function StyledComponent<P = any>(
  callback: StyleCallback,overrideStyleOptions?:StyledComponentOptions | null
):StyledWrapperComponentProducer<P>
export function StyledComponent<P = any,ReduxProps = any, S = IRootState>(
  callback: StyleCallback,selectors?:Selectors<P,ReduxProps,S> | null,overrideStyleOptions?:StyledComponentOptions | null
):StyledWrapperComponentProducer<P>
export function StyledComponent<P = any,ReduxProps = any,S = IRootState>(
  callback: StyleCallback,
  selectorsOrOptions:Selectors<P,ReduxProps,S> | StyledComponentOptions | null = null,
  overrideStyleOptions:StyledComponentOptions | null = null
):StyledWrapperComponentProducer<P> {

  // STYLE WRAPPER FIRST

  const
    selectors:Selectors<P,ReduxProps,S> = {} as any,
    styleOptions:StyledComponentOptions = Object.assign({},overrideStyleOptions)

  if (selectorsOrOptions) {
    if (isSelectors(selectorsOrOptions)) {
      Object.assign(selectors, selectorsOrOptions)
    } else {
      Object.assign(styleOptions,selectorsOrOptions)
    }
  }

  let wrappers = [withStatefulStyles(callback, styleOptions)] as Array<StyledWrapperComponentProducer<P>>

  // IF SELECTORS PROVIDED
  if (selectors && Object.keys(selectors).length > 0)
    wrappers = [connect(createStructuredSelector(selectors)) as any,...wrappers]

  const
    extraWrappers = (styleOptions.extraWrappers || {}) as ExtraComponentWrappers<P>,
    {inner = [], outer = []} = extraWrappers

  guard(() => {
    wrappers = [...outer,...wrappers,...inner]
  })

  return (((Producer) => {
    return wrappers.reduceRight((elem,wrapper):StyledElement<P> =>
      (wrapper as any)(elem as any) as any, Producer) as StyledComponentProducer<P>
  }) as any) as StyledWrapperComponentProducer<P>
}
