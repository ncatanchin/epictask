import {Repo as TSRepo} from 'typestore'
import {ActionFactory,ActionReducer,ActionPromise,Action} from 'typedux'
import {SearchKey, DataKey} from "shared/Constants"
import {AutoWired,Inject, Container} from 'typescript-ioc'
import {RepoActionFactory} from '../repo/RepoActionFactory'
import {DataMessage, DataState, DataRequest} from 'shared/actions/data/DataState'
import {Stores} from 'main/services/DBService'
import {Map} from 'immutable'
import {ModelConstructor} from 'shared/Registry'


const uuid = require('node-uuid')

const modelPromises:{[key:string]:Promise<any>} = {}

const log = getLogger(__filename)

/**
 * Search Action Factory
 */
@AutoWired
export class DataActionFactory extends ActionFactory<DataState,DataMessage> {

	@Inject
	private repoActions:RepoActionFactory



	constructor() {
		super(DataState)
	}

	/**
	 * Seach leaf
	 *
	 * @returns {string}
	 */
	leaf():string {
		return DataKey;
	}

	async getModels(modelType:string,...modelIds:Array<string|number>) {
		modelType = _.camelCase(modelType)

		const stores = Container.get(Stores)
		const modelStore:TSRepo<any> = stores[modelType]

		assert(modelStore,`No model store found for model type ${modelType}`)

		const models = await modelStore.bulkGet(...modelIds)

		return models
			.map((model,index) => ({model,index,id:modelIds[index]}))
			.filter((item:any) => item.model)
			.reduce((modelMap,item) => {
				modelMap[item.id] = item.model
				return modelMap
			},{})



	}

	@ActionReducer()
	updateRequest(request:DataRequest) {
		return (state:DataState) => {
			return state.setIn(['requests',request.id],request)
		}
	}


	@ActionReducer()
	updateModels(modelType:string|ModelConstructor<any>,updatedModels:any,clear=false) {
		assert(modelType, 'No model type provided')
		if (!_.isString(modelType))
			modelType = modelType.$$clazz

		assert(modelType, 'A valid model type is required')

		return (state:DataState) => {

			return state.updateIn(['models',modelType],Map(),(models) => {


				return models.withMutations(tempModels => {
					const modelIds = Object.keys(updatedModels)
					modelIds.forEach(key => tempModels = tempModels.set(`${key}`,updatedModels[key]))


					if (clear) {
						const removeIds = tempModels.keySeq()
							.filter(modelId => !modelIds.includes(modelId))
							.toArray()

						removeIds.forEach(removeId => tempModels = tempModels.remove(removeId))
					}
					return tempModels
				})
			})
		}

	}

	@ActionReducer()
	setRequestFulfilled(id:string,fulfilled:boolean) {
		return (state:DataState) => {
			const request = state.requests.get(id)
			return (!request) ? state :
				state.setIn(['requests', request.id], Object.assign({}, request, {fulfilled}))
		}
	}

	@ActionReducer()
	removeModels(modelType:string,removedIds:Array<string|number>) {
		return (state:DataState) => {
			return state.updateIn(['models',modelType],models => {
				return models.withMutation(tempModels => {
					removedIds.forEach(removedId => tempModels = tempModels.delete(removedId))
					return tempModels
				})
			})
		}

	}



	@ActionPromise()
	submitRequest(request:DataRequest,withModelMap:{[id:string]:any} = {}) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				{modelType,modelIds,fulfilled} = request

			if (modelIds.length === 0)
				request.fulfilled = true

			actions.updateRequest(request)

			if (request.fulfilled)
				return

			// Next tick
			await Promise.setImmediate()

			const state = getState().get(DataKey)
			const models = state.models.get(modelType)

			let newModelIds = modelIds
				.filter(modelId => !models || (!models.get(modelId) && !withModelMap[modelId]))


			const newModelMap = await this.getModels(modelType,...newModelIds)


			Object.assign(withModelMap,newModelMap)
			this.updateModels(modelType,withModelMap)

			await Promise.setImmediate()

			actions.setRequestFulfilled(request.id,true)

		}
	}

}

export default DataActionFactory