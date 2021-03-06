
import {Map,List} from 'immutable'

import { shallowEquals, cloneObject, cloneObjectShallow } from "epic-global/ObjectUtil"

const
	log = getLogger(__filename)

/**
 * Compare a new and existing model either oin updated_at (the default method) or a set of properties provided
 *
 * @param logger
 * @param id
 * @param newModel
 * @param existingModel
 * @param props
 * @returns {any}
 */
export function checkUpdatedAndAssign(logger,id:string|number,newModel,existingModel,...props:string[]):any {
	if (existingModel) {
		if (!props.length) {
			const
				existingTime = existingModel.updated_at && moment(existingModel.updated_at || existingModel.created_at).valueOf(),
				newTime = moment(newModel.updated_at || newModel.created_at).valueOf()
			
			assert(existingTime && newTime, `Found null updated_at field for model on update check (clazz=${newModel.$$clazz}) ${id}`)
			
			if (existingTime >= newTime) {
				logger.info(`No change in comment ${id}, ${newModel.updated_at} vs existing updated time ${existingModel.updated_at}`)
				return false
			}
		} else if(shallowEquals(newModel,existingModel,...props)) {
			logger.info(`No changes detected for ${newModel.$$clazz} ${id} with props ${props.join(', ')}`)
			return false
		}
		
		// CHANGES WERE MADE - MERGE AND RETURN
		assign(!existingModel ? {} : cloneObjectShallow(existingModel), newModel)
		
		//COPY THE DOC PROP
		if (existingModel && existingModel.$$doc) {
			newModel.$$doc = existingModel.$$doc
		}
	}
	
	return newModel
}


function makeInstance(type,val) {
	return new (type as any)(val)
}

/**
 * Revive an immutable object tree
 *
 * @param val
 * @param type
 * @param listProps
 * @param mapProps
 * @returns {any}
 */
export function reviveImmutable<T>(val:any,type:{new():T},listProps:string[] = [],mapProps:string[] = []):T {
	try {
		val = val || {}
		
		
		// SET LIST PROPS
		listProps.forEach(prop => {
			
			let
				propVal = val.get ? val.get(prop) : val[ prop ]
			
			if (!propVal)
				propVal = List()
			
			if (!List.isList(propVal)) {
				propVal = List(propVal)
			}
			
			if (val.withMutations) {
				val = val.set(prop, propVal)
			} else {
				val[ prop ] = propVal
			}
		})
		
		//SET MAP PROPS
		mapProps.forEach(prop => {
			
			let
				propVal = val.get ? val.get(prop) : val[ prop ]
			
			if (!propVal)
				propVal = Map()
			
			if (!Map.isMap(propVal)) {
				propVal = Map(propVal)
			}
			
			if (val.withMutations) {
				val = val.set(prop, propVal)
			} else {
				val[ prop ] = propVal
			}
			
		})
		
		
		
		
		return val && val instanceof type ?
			
			// IF ALREADY IMMUTABLE INSTANCE
			val :
			
			// OBJECT TYPE
			makeInstance(type,val)
	} catch (err) {
		log.warn(`Failed to revive immutable`,err)
		return makeInstance(type,{})
	}
}