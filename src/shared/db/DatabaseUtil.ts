import {Repo as TSRepo,IModel} from 'typestore'

const
	CHUNK_SIZE = 50,
	log = getLogger(__filename)


/**
 * Load all model classes
 *
 * @returns {any[]}
 */
export function loadModelClasses() {
	const allModelsAndRepos = require('shared/models')
	const names = Object.keys(allModelsAndRepos)

	return names
		.filter(name => {
			const val = allModelsAndRepos[name]
			return !_.endsWith(name,'Store') && _.isFunction(val)
		})
		.map(name => {
			log.debug(`Loading model class: ${name}`)
			return allModelsAndRepos[name]
		})
}



/**
 * Bulk save models
 *
 * @param models
 * @param modelStore
 */
export async function chunkSave<T extends IModel>(models:T[],modelStore:TSRepo<T>) {
	if (!models.length)
		return
	
	const
		chunks = _.chunk(models,CHUNK_SIZE)
	
	for (let chunk of chunks) {
		await modelStore.bulkSave(...chunk)
	}
}

// /**
//  * Bulk remove models
//  *
//  * @param databaseService
//  * @param modelIds
//  */
// export async function chunkRemove(databaseService,modelIds) {
//
// 	modelIds = _.uniq(modelIds.map(modelId => `${modelId}`))
//
// 	const chunks = _.chunk(modelIds,CHUNK_SIZE)
// 	const {dbProxy} = databaseService
// 	assert(dbProxy,'could not get database reference in chunkRemove')
//
// 	for (let chunk of chunks) {
// 		await dbProxy.bulkDocs(chunk.map(_id => ({_id,_deleted:true})))
// 	}
// }

