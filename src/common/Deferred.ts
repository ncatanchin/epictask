import {isDefined} from "typeguard"
import * as BBPromise from 'bluebird'

interface DeferredState<T> {
  resolve: (result?:T) => void
  reject: (err:any) => void
  isSettled: boolean
  isCancelled: boolean
  result:T
}

/**
 * A deferred promise that can be resolved or rejected
 * externally, ideal for functions like a promise timeout
 */
export class Deferred<T> {
  
  static async delay(millis:number) {
    const deferred = new Deferred<void>()
    setTimeout(() => deferred.resolve(),millis)
    await deferred.promise
  }
  
  private state:DeferredState<T> = {
    resolve: null,
    reject: null,
    isSettled: false,
    isCancelled: false,
    result: null
  }
  
  readonly promise:BBPromise<T> = new BBPromise<T>((resolve, reject) =>
    Object.assign(this.state, {
      resolve,
      reject
    })
  )

  
  constructor(promise?:Promise<T> | BBPromise<T>) {
    if (isDefined(promise)) {
      if (promise instanceof Promise) {
        promise
          .then(this.state.resolve)
          .catch(this.state.reject)
      } else {
        promise
          .then(result => this.state.resolve(result))
          .catch(err => this.state.reject(err))
      }
    }
  }
  
  
  isSettled() {
    return this.state.isSettled
  }
  
  isCancelled() {
    return this.state.isCancelled
  }
  
  cancel() {
    this.state.isSettled = true
    this.state.isCancelled = true
  }
  
  resolve(result?:T) {
    if (!this.state.isSettled && !this.state.isCancelled) {
      this.state.isSettled = true
      this.state.resolve(result)
    }
  }
  
  reject(err:any) {
    if (!this.state.isSettled && !this.state.isCancelled) {
      this.state.isSettled = true
      this.state.reject(err)
    }
  }
}

export default Deferred
