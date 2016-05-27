import 'reflect-metadata'
import {getLogger as LoggerFactory} from 'typelogger'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'
import * as LodashGlobal from 'lodash'
import * as ContextUtils from './util/ContextUtils'

import {AppStateType as AppStateTypeGlobal} from './AppStateType'

/**
 * Declare globals
 *
 * @global getLogger
 */
declare global {
	var getLogger:typeof LoggerFactory
	var Immutable:typeof ImmutableGlobal
	var TypeMutant:typeof TypeMutantGlobal
	var requireContext:typeof ContextUtils.requireContext
	var mergeContext:typeof ContextUtils.mergeContext
	var _:typeof LodashGlobal
	var Env:any

}

// Export globals
const isDev = process.env.NODE_ENV === 'development'

Object.assign(global as any,{
	getLogger: LoggerFactory,
	Immutable: ImmutableGlobal,
	TypeMutant: TypeMutantGlobal,
	_:LodashGlobal,
	AppStateType: AppStateTypeGlobal,
	Env: {
		isDev,
		isDebug: DEBUG && isDev,
		isHot: !LodashGlobal.isNil(process.env.HOT)
	}
},ContextUtils)


export { }
