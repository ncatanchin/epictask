import {Repo as TSRepo} from 'typestore'
import {ActionFactory,Action} from 'typedux'
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
		return SearchKey;
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

	@Action()
	updateRequest(request:DataRequest) {}

	@Action()
	setRequestFulfilled(id:string,fulfilled:boolean) {
	}

	@Action()
	updateModels(modelType:string|ModelConstructor<any>,updatedModels:any) {
	}

	@Action()
	removeModels(modelType:string,removedIds:Array<string|number>) {
	}

	@Action()
	submitRequest(request:DataRequest) {
		return async (dispatch,getState) => {
			const
				actions = this.withDispatcher(dispatch,getState),
				{modelType,modelIds,fulfilled} = request

			if (modelIds.length === 0)
				request.fulfilled = true

			actions.updateRequest(request)

			if (fulfilled)
				return

			// Next tick
			await Promise.setImmediate()

			const state = getState().get(DataKey)
			const models = state.models.get(modelType)

			const newModelIds = modelIds
				.filter(modelId => !models || !models.get(modelId))

			const newModels = await this.getModels(modelType,...newModelIds)


			this.updateModels(modelType,newModels)

			await Promise.setImmediate()

			actions.setRequestFulfilled(request.id,true)

		}
	}

}

export default DataActionFactory