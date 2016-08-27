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
	 * @param clear
	 */
	static create(id,fulfilled,modelIds,modelType,clear = false):DataRequest {
		return new DataRequest({
			id,fulfilled,modelIds,modelType,clear
		})
	}

	/**
	 * Map from JS to model
	 *
	 * @param o
	 */
	static fromJS = (o:any) => new DataRequest(o)

	id:string
	clear:boolean = false
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

	static fromJS(o:any = {}) {
		if (o && o instanceof DataState)
			return o
		
		const keys = o.get ?
			(o.get('models').keySeq().toArray()) :
			Object.keys(o.models || {})
		
		const modelsMap = keys
			.reduce((map,modelType) => {
				const modelMap = o.get ? o.get('models') : o.models
				
				map[modelType] = Map<string,any>()
				
				if (modelMap) {
					const models = modelMap.get ? modelMap.get(modelType) : modelMap[modelType]
					if (models) {
						Object
							.keys(models)
							.forEach(key =>
								map[modelType] = map[modelType]
									.set(key,models.get ? models.get(key) : models[key]))
					}
				}
				
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
