import 'reflect-metadata'
import {getLogger as LoggerFactory} from 'typelogger'
import * as ImmutableGlobal from 'immutable'
import * as TypeMutantGlobal from 'typemutant'

/**
 * Declare globals
 *
 * @global getLogger
 */
declare global {
	var getLogger:typeof LoggerFactory
	var Immutable:typeof ImmutableGlobal
	var TypeMutant:typeof TypeMutantGlobal
}


// Export globals
Object.assign(global as any,{
	getLogger: LoggerFactory,
	Immutable: ImmutableGlobal,
	TypeMutant: TypeMutantGlobal
})


export { }
