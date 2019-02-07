import * as React from "react"

import getLogger from "common/log/Logger"
import {isFunction, isString} from "typeguard"
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import {
  StyledComponentProducer,
  StyledElement,
  StyledWrapperComponentProducer
} from "renderer/components/elements/StyledComponent"
import * as _ from 'lodash'

const log = getLogger(__filename)



export default abstract class Controller {
  clone():this {
    return _.clone(this)
  }
}

export type ControllerProviderState<C extends Controller = any> = [(C | null),((controllerUpdate:C) => void)]
export const ControllerContext = React.createContext<ControllerProviderState>(null)


export function useController<C extends Controller>():[C,(controllerUpdate:C | ((oldController:C) => C)) => void] | null {
  return useContext(ControllerContext) as [C,(controllerUpdate:C) => void]
}


function generateChangeSet<P>(props:P, changeSetProps: (Array<keyof P> | ((props:P) => any[]) | null)):any[] {
  if (!changeSetProps) return []
  else if (isFunction(changeSetProps)) return changeSetProps(props)
  else return changeSetProps.map(prop => props[prop])
}

export function withController<P = any, C extends Controller = any>(
  controllerFactory:(props:P) => C,
  changeSetProps: (Array<keyof P> | ((props:P) => any[]) | null) = []
):StyledWrapperComponentProducer<P> {
  return (Producer:StyledComponentProducer<P>):StyledComponentProducer<P> => {
    return (props:P):StyledElement<P> => {
      const
        changeSet = generateChangeSet(props,changeSetProps),
        controllerFactoryMemo = useCallback(() => controllerFactory(props),changeSet),
        [controller, setController] = useState<C>(controllerFactoryMemo),
        controllerProps = useMemo<[C,(newController:C) => void]>(
          () => [controller,setController],
          [controller,setController]
        )

      useEffect(() => {
        setController(controllerFactory(props))
      }, changeSet)

      return <ControllerContext.Provider value={controllerProps}>
        <Producer {...props}/>
      </ControllerContext.Provider>
    }
  }
}
