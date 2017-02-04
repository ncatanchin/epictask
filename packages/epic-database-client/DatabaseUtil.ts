import {Repo as TSRepo,IModel} from 'typestore'
import { nilFilter } from "epic-util/ListUtil"
import { getValue } from "epic-global/ObjectUtil"

const
	CHUNK_SIZE = 50,
	log = getLogger(__filename)


/**
 * Load all model classes
 *
 * @returns {any[]}
 */
export function loadModelClasses() {
	
	
	const
		allModelsAndRepos = require('epic-models'),
		names = Object.keys(allModelsAndRepos)

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
export function chunkSave<T extends IModel>(models:T[],modelStore:TSRepo<T>) {
	if (!models.length)
		return Promise.resolve()
	
	const
		chunks = _.chunk(models,CHUNK_SIZE),
		deferred = Promise.defer(),
		saveNextChunk = () => {
			try {
				const
					chunk = chunks.shift()
				
				modelStore.bulkSave(...chunk)
					.then(() => {
						if (chunks.length) {
							setTimeout(saveNextChunk, 1)
						} else {
							deferred.resolve()
						}
					})
					.catch(err => deferred.reject(err))
			} catch (err) {
				log.error(`Chunk save failed`,err)
				deferred.reject(err)
			}
			
		}
	
	saveNextChunk()
	
	return deferred.promise
	
}

/**
 * Chunk remove utility
 *
 * @param modelIds
 * @param repo
 * @returns {Promise<undefined>}
 */
export function chunkRemove(modelIds,repo:TSRepo<any>) {
	if (!modelIds || !modelIds.length)
		return Promise.resolve()
	
	return repo.bulkRemove(...modelIds)
}

/**
 * Convert changes to models
 *
 * @param changes
 * @returns {T[]}
 */
export function changesToModels<T>(changes:IDatabaseChange[]):T[] {
	return nilFilter(changes.map(it => it.model)) as T[]
}

/**
 * Convert change list to deleted ids
 *
 * @param changes
 * @returns {number[]}
 */
export function changesToDeletedIds(changes:IDatabaseChange[]):number[] {
	return nilFilter(
		changes
			.filter(it => it.deleted)
			.map(it => getValue(() => it.model.id,null))
	) as number[]
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

