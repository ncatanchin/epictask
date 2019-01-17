import {isDefined} from "typeguard"


declare global {
  interface Array<T> {
    filterNotNull():Array<T>
  }
}

Array.prototype.filterNotNull = function<T = any>():Array<T> {
  return this.filter(it => isDefined(it))
}

export {}
