import {isDefined} from "typeguard"

declare global {

  interface Array<T> {
    hasOne():boolean
    //first():T | null
    filterNotNull():Array<T>
    mapNotNull<U>(map: string|sugarjsLocal.Array.mapFn<T, U>, context?: any): U[]
  }
}

Array.prototype.filterNotNull = function<T = any>():Array<T> {
  return this.filter(it => isDefined(it))
}

Array.prototype.mapNotNull = function<T = any,U = any>(map: string|sugarjsLocal.Array.mapFn<T, U>, context?: any):Array<T> {
  return this.map(map,context).filterNotNull()
}

Array.prototype.hasOne = function() {
  return this.length === 1
}

// Array.prototype.first = function() {
//   return this[0]
// }

export {}
