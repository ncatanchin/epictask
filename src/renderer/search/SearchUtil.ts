import {isObject, isString} from "typeguard"

export type ScanTarget = string | Object | Array<any>

export function scanObject(predicate:string,target:ScanTarget):boolean {
  if (isString(target)) {
    return target.includes(predicate)
  } else if (Array.isArray(target)) {
    return target.some(nextTarget => scanObject(predicate,nextTarget))
  } else if (isObject(target)) {
    return Object.values(target).some(nextTarget => scanObject(predicate,nextTarget))
  } else {
    return false
  }
}

export function scanObjects(predicate:string,...targets:Array<ScanTarget>):boolean {
  return targets.some(target => scanObject(predicate,target))
}