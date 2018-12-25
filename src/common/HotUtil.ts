import * as _ from "lodash"

import getLogger from "common/log/Logger"
import {getValue, isDefined} from "typeguard"

const log = getLogger(__filename)

export function getHot<T>(mod, key, defaultValue:() => T = null):T {
  if (module.hot) {
    const existingVal = _.get(mod, `hot.data.${key}`) as any
    if (isDefined(existingVal))
      return existingVal as T
  }
  
  return getValue(() => defaultValue())
}

export function setDataOnHotDispose(mod, dataFn:() => any):void {
  if (module.hot) {
    if (mod.hot) {
      // Add a handler which is executed when the current module code is replaced.
      mod.hot.addDisposeHandler((data:any) => {
        // execute dataFn() and apply the outputs to 'data'
        _.assign(data, dataFn())
      })
    }
  }
}

// Add a handler which is executed when the current module code is replaced.
export function addHotDisposeHandler(mod, fn):void {
  if (module.hot) {
    mod.hot.addDisposeHandler(fn)
  }
}

export function acceptHot(mod, logger = null):void {
  if (module.hot) {
    if (mod.hot) {
      mod.hot.accept(() => (logger || console).debug(`Self accepting HMR`))
    }
  }
}

acceptHot(module, console)
