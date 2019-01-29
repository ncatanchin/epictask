import * as React from "react"

import getLogger from "common/log/Logger"
import {isFunction, isString} from "typeguard"
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from "react"
import {
  StyledComponentProducer,
  StyledElement,
  StyledWrapperComponentProducer
} from "renderer/components/elements/StyledComponent"

const log = getLogger(__filename)



export default abstract class Controller {
  clone():this {
    return _.clone(this)
  }
}

//, newControllerCallback:((newController:C) => void) | null = null
// export function makeController<C extends Controller>(controllerSrc:C):C {
//   let controller:C = controllerSrc
//   log.info("New controller", controller)
//   const fnCache = {} as any
//
//   return new Proxy({} as any,{
//     get: function(o,prop:string):any {
//       //log.info("Get prop", prop)
//       if (isString(prop) && prop.startsWith("set") && isFunction(o[prop])) {
//         return (...args) => {
//           controller = o = o.clone()
//           controller = o = (o[prop] as Function).apply(o, args)
//
//           // if (newControllerCallback)
//           //   newControllerCallback(makeController(controller,newControllerCallback))
//           return makeController(o)
//           // if (!fnCache[prop]) {
//           //   fnCache[prop] =
//           //   }
//           // }
//           // return fnCache[prop]
//         }
//       } else {
//         return controller[prop]
//       }
//     }
//   })
// }

export type ControllerProviderState<C extends Controller = any> = [(C | null),((controllerUpdate:C) => void)]
export const ControllerContext = React.createContext<ControllerProviderState>(null)

// export function useControllerProvider<C extends Controller>(factory:() => C,changeSet:any[]):ControllerProviderState<C> {
//   const
//     //controllerRef = useRef<C | null>(null),
//     controllerFactory = useCallback(() => {
//       const newController = factory()
//       return newController ? makeController(newController) : null
//     },changeSet),
//     [controller,setController] = useState<C|null>(controllerFactory)
//     // updateController = useCallback((controllerUpdate:C) => {
//     //   setController(controllerUpdate)
//     //   //controllerRef.current = controllerUpdate
//     // },[setController])
//
//
//   useEffect(() => {
//     //if (!controller) {
//       const newController = controllerFactory()
//       if (newController) setController(newController)
//     //}
//   },changeSet)
//
//
//   //useDebugValue(() => controllerRef.current)
//   // useEffect(() => {
//   //   if (!controller) {
//   //     const innerController = factory()
//   //     if (innerController) {
//   //       controller = makeController(innerController, newController => setController(newController))
//   //       setController(controller)
//   //     }
//   //   }
//   // }, [factory,setController])
//
//   return [controller, setController]
// }


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
