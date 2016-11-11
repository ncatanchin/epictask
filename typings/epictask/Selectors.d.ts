///<reference path="../../node_modules/immutable/dist/immutable.d.ts"/>



//import {Map} from 'immutable'

/**
 * Root state type
 */
declare type TRootState = Immutable.Map<string,Immutable.Map<string,any>>

/**
 * Simple select type def
 */
declare type TSelector<RT> = (state:TRootState,props?:any) => RT
