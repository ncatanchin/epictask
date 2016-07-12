const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Map,List,Record} from 'immutable'
import {ActionMessage} from 'typedux'


@RegisterModel
export class DataRequest {

	/**
	 * Simple creator
	 *
	 * @param id
	 * @param fulfilled
	 * @param modelIds
	 * @param modelType
	 * @returns {DataRequest}
	 */
	static create(id,fulfilled,modelIds,modelType):DataRequest {
		return new DataRequest({
			id,fulfilled,modelIds,modelType
		})
	}

	/**
	 * Map from JS to model
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new DataRequest(o)

	id:string
	fulfilled:boolean = false
	modelIds:Array<string|number> = []
	modelType:string

	constructor(o:any = {}) {
		if (o.modelIds)
			o.modelIds = o.modelIds.map(id => (id instanceof Number) ? id.valueOf() : id)
		Object.assign(this,o)
	}

}

export interface DataResultsContainer {
	id:string
	request:DataRequest
	fulfilled:boolean
	models:Array<any>
}


export const DataStateRecord = Record({
	requests:Map<string,DataRequest>(),
	models:Map<string,Map<string,any>>()
})


/**
 * Registry state
 *
 */
@RegisterModel
export class DataState extends DataStateRecord {

	static fromJS(o:any) {
		const modelsMap = Object
			.keys(o.models)
			.reduce((map,modelType) => {
				map[modelType] = Map<string,any>(o.models[modelType])
				return map
			},{})

		return new DataState(Object.assign({},o,{
			requests: Map<string,DataRequest>(o.requests),
			models: Map<string,Map<string,any>>(modelsMap)
		}))
	}


	requests:Map<string,DataRequest>
	models:Map<string,Map<string,any>>

}

/**
 * RepoMessage
 */
export interface DataMessage extends ActionMessage<DataState> {

}
