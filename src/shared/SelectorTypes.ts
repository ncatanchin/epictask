

import {Map} from 'immutable'

/**
 * Root state type
 */
export type TRootState = Map<string,Map<string,any>>

/**
 * Simple select type def
 */
export type TSelector<RT> = (state:TRootState,props?:any) => RT
