import {List,Record,Map} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {DataMessage, DataState, DataRequest} from 'shared/actions/data/DataState'
import {DataKey} from 'shared/Constants'
import {ModelConstructor} from 'shared/Registry'

export class DataReducer extends DefaultLeafReducer<DataState,DataMessage> {

	constructor() {
		super(DataKey, DataState)
	}


	defaultState():any {
		return new DataState()
	}

	setRequestFulfilled(state:DataState,id:string,fulfilled:boolean) {
		const request = state.requests.get(id)
		return (!request) ? state :
			state.setIn(['requests',request.id], Object.assign({},request,{fulfilled}))
	}

	updateRequest(state:DataState,request:DataRequest) {
		return state.setIn(['requests',request.id],request)
	}

	updateModels(state:DataState,modelType:string|ModelConstructor<any>,updatedModels:any) {
		assert(modelType, 'No model type provided')
		if (!_.isString(modelType))
			modelType = modelType.$$clazz

		assert(modelType, 'A valid model type is required')

		return state.updateIn(['models',modelType],Map(),(models) => {
			return models.withMutations(tempModels => {
				Object.keys(updatedModels)
					.forEach(key => tempModels = tempModels.set(key,updatedModels[key]))

				return tempModels
			})
		})
	}

	removeModels(state:DataState,modelType:string,removedIds:Array<string|number>) {
		return state.updateIn(['models',modelType],models => {
			return models.withMutation(tempModels => {
				removedIds.forEach(removedId => tempModels = tempModels.delete(removedId))
				return tempModels
			})
		})
	}

}