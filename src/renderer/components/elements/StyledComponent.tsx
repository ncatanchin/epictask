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


const log = getLogger(__filename)


function baseStyles(theme): StyleDeclaration {
  const
    {palette} = theme,
    {primary, secondary} = palette

  return {
    root: []
  }
}

export type Selectors<S = any,T = any, P = any> =
  {[K in keyof T]: Selector<S, T[K]>} |
  {[K in keyof T]: ParametricSelector<S, P, T[K]>}

export type ExtraComponentWrappers<P,ST> = {
  inner?: Array<StyledWrapperComponentProducer<P,ST>>,
  outer?: Array<StyledWrapperComponentProducer<P,ST>>
}

export interface StyledComponentOptions<S = any,T = any,P = any,ST = any> extends WithStylesOptions<string> {
  extraWrappers?: ExtraComponentWrappers<P,ST>
}


function isSelectors<T = any>(o:any):o is {[K in keyof T]: Function} {
  return o && Object.values(o).every(isFunction)
}

export type StyledElement<P = any> = React.ReactElement<P>
export type StyledComponentProducer<P = any,S = any> = (props:P) => StyledElement<P> //)// | React.ComponentClass<P,S> | ((...args:any[]) => React.ReactNode | React.ComponentClass<P,S>)
export type StyledWrapperComponentProducer<P = any,ST = any> = (fn:StyledComponentProducer<P, ST>) => StyledComponentProducer<P, ST>

export function StyledComponent<P = any,S = any,T = any,ST = any>(
  callback: StyleCallback,overrideStyleOptions?:StyledComponentOptions | null
):StyledWrapperComponentProducer<P,ST>
export function StyledComponent<P = any,S = any,T = any,ST = any>(
  callback: StyleCallback,selectors?:Selectors<S,T,P> | null,overrideStyleOptions?:StyledComponentOptions | null
):StyledWrapperComponentProducer<P,ST>
export function StyledComponent<P = any,S = any,T = any,ST = any>(
  callback: StyleCallback,
  selectorsOrOptions:Selectors<S,T,P> | StyledComponentOptions | null = null,
  overrideStyleOptions:StyledComponentOptions | null = null
):(fn:((props:P) => React.ReactElement<P>)) => ((props:P) => React.ReactElement<P>) { // StyledWrapperComponentProducer<P,ST>

  // STYLE WRAPPER FIRST

  const
    selectors:Selectors<S,T,P> = {} as any,
    styleOptions:StyledComponentOptions = Object.assign({},overrideStyleOptions)

  if (selectorsOrOptions) {
    if (isSelectors(selectorsOrOptions)) {
      Object.assign(selectors, selectorsOrOptions)
    } else {
      Object.assign(styleOptions,selectorsOrOptions)
    }
  }

  let wrappers = [withStatefulStyles(callback, styleOptions)] as Array<StyledWrapperComponentProducer<P,ST>>

  // IF SELECTORS PROVIDED
  if (selectors && Object.keys(selectors).length > 0)
    wrappers = [connect(createStructuredSelector(selectors)) as any,...wrappers]

  const
    extraWrappers = (styleOptions.extraWrappers || {}) as ExtraComponentWrappers<P,ST>,
    {inner = [], outer = []} = extraWrappers

  guard(() => {
    wrappers = [...outer,...wrappers,...inner]
  })

  return (((Producer) => {
    return wrappers.reduceRight((elem,wrapper):StyledElement<P> =>
    (wrapper as any)(elem as any) as any
  , Producer) as StyledComponentProducer<P,ST>
  }) as any) as (fn:((props:P) => React.ReactElement<P>)) => ((props:P) => React.ReactElement<P>)
}
//
//
// export function StyledCommandComponent<S = any,T = any,P = any,ST = any>(
//   callback: StyleCallback,overrideStyleOptions?:StyledComponentOptions | null
// )
// export function StyledCommandComponent<S = any,T = any,P = any,ST = any>(
//   callback: StyleCallback,selectors?:Selectors<S,T,P> | null,overrideStyleOptions?:StyledComponentOptions | null
// )
// export function StyledCommandComponent<S = any,T = any,P = any,ST = any>(
//   callback: StyleCallback,
//   selectorsOrOptions:Selectors<S,T,P> | StyledComponentOptions | null = null,
//   overrideStyleOptions:StyledComponentOptions | null = null
// ):((Producer:StyledComponentProducer<P,ST>) => StyledComponentProducer<P,ST>) {
//   overrideStyleOptions = Object.assign({},overrideStyleOptions, {
//     extraWrappers: {
//       inner: [CommandComponent()]
//     }
//   })
//
//   return StyledComponent(callback, selectorsOrOptions as any, overrideStyleOptions)
// }
//
//
// export default StyledComponent
