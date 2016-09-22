

import { shallowEquals, cloneObject } from "shared/util/ObjectUtil"
import * as moment from 'moment'

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
		assign(!existingModel ? {} : cloneObject(existingModel), newModel)
		
		//COPY THE DOC PROP
		if (existingModel && existingModel.$$doc) {
			newModel.$$doc = existingModel.$$doc
		}
	}
	
	return newModel
}