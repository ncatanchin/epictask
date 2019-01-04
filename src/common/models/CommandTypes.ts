import * as React from 'react'
//import * as BBPromise from 'bluebird'
import Deferred from "common/Deferred"
import {PromiseResolver} from "common/Types"
export interface IAcceleratorMap {
  [key:string]: string
}

export type TComponent<P> = React.ComponentClass<P>

/**
 * React component class
 */
export type TComponentAny = TComponent<any>

/**
 * Component resolver
 */
export type TComponentResolver = PromiseResolver<TComponentAny>


export type TComponentLoader<T> = (resolver:Deferred<T>) => void

export type TPromisedComponentLoader<T> = () => Promise<T>
