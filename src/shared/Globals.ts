import 'reflect-metadata'
import {getLogger as LoggerFactory} from 'typelogger'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'
import * as LodashGlobal from 'lodash'
import * as ContextUtils from './util/ContextUtils'


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
}



// Export globals
Object.assign(global as any,{
	getLogger: LoggerFactory,
	Immutable: ImmutableGlobal,
	TypeMutant: TypeMutantGlobal,
	_:LodashGlobal
},ContextUtils)


export { }
