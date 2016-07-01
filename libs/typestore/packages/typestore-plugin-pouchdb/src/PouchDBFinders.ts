import {Log,Repo,isFunction} from 'typestore'
import {enableQuickSearch} from './PouchDBSetup'

import {
	IPouchDBFullTextFinderOptions, IPouchDBFilterFinderOptions, IPouchDBFnFinderOptions,
	IPouchDBMangoFinderOptions
} from './PouchDBDecorations'
import {getIndexByNameOrFields, makeMangoIndex} from './PouchDBIndexes'
import {mapDocs, transformDocumentKeys, mapAttrsToField} from './PouchDBUtil'

const log = Log.create(__filename)

export async function findWithText(pouchRepo,text:string,fields:string[],limit = -1,offset = -1,includeDocs = true) {
	enableQuickSearch()

	const attrFields = mapAttrsToField(fields)
	const opts:any = {
		query:text,
		fields: attrFields,
		include_docs: includeDocs,
		filter: (doc) => {
			//log.info('filtering full text',doc)
			return doc.type === pouchRepo.modelType.name
		}
	}

	if (limit > 0) {
		opts.limit = limit
	}

	if (offset > 0) {
		opts.skip = offset
	}

	log.debug('Querying full text with opts',opts)
	const result = await pouchRepo.db.search(opts)

	log.debug(`Full-Text search result`,result)
	return result.rows.map(row => row.doc)
}




export function findWithSelector(pouchRepo, selector,sort = null,limit = -1,offset = -1,includeDocs = true) {

	const opts = {
		selector: Object.assign({
			type: pouchRepo.modelType.name
		},transformDocumentKeys(selector || {}))
	} as any

	if (sort)
		opts.sort = transformDocumentKeys(sort)

	if (limit > -1)
		opts.limit = limit

	if (offset > -1)
		opts.offset = offset

	log.debug('findWithSelector, selector',selector,'opts',JSON.stringify(opts,null,4))

	return pouchRepo.db.find(opts)
}



export function makeFullTextFinder(pouchRepo,finderKey:string,opts:IPouchDBFullTextFinderOptions) {
	enableQuickSearch()
	let {textFields,queryMapper,build,minimumMatch,limit,offset} = opts

	/**
	 * Create full text index before hand
	 * unless explicitly disabled
	 *
	 * @type {Promise<boolean>}
	 */
	const buildIndexPromise = (build !== false) ? pouchRepo.db.search({
		fields:textFields,
		build:true
	}) : Promise.resolve(false)

	return async (...args) => {
		await buildIndexPromise

		const query = (queryMapper) ?
			queryMapper(...args) :
			args[0]

		const result = await findWithText(
			pouchRepo,query,textFields,limit,offset,true
		)

		log.debug('Full text result for ' + finderKey ,result,'args',args)

		return mapDocs(pouchRepo.repo.modelClazz,result)



	}
}

export function makeFilterFinder(pouchRepo,finderKey:string,opts:IPouchDBFilterFinderOptions) {
	log.warn(`Finder '${finderKey}' uses allDocs filter - THIS WILL BE SLOW`)

	const {filter} = opts

	return async (...args) => {
		const allModels = await pouchRepo.all()
		return allModels.filter((doc) => filter(doc,...args))
	}
}

export function makeFnFinder(pouchRepo,finderKey:string,opts:IPouchDBFnFinderOptions) {
	const {fn} = opts

	return async (...args) => {
		const result = await fn(pouchRepo, ...args)
		return mapDocs(pouchRepo.repo.modelClazz,result)
	}
}

export function makeMangoFinder(pouchRepo,finderKey:string,opts:IPouchDBMangoFinderOptions) {
	let {selector,sort,limit,all,indexName,indexDirection,indexFields} = opts

	let indexReady = all === true
	let indexCreate = null

	if (all) {
		indexCreate = Promise.resolve(null)
	} else {
		assert(indexName || indexFields,
			"You MUST provide either indexFields or indexName")

		assert(indexName || finderKey,`No valid index name indexName(${indexName}) / finderKey(${finderKey}`)

		// In the background create a promise for the index
		//const indexDeferred = Bluebird.defer()

		indexName = indexName || `idx_${pouchRepo.modelType.name}_${finderKey}`

		indexCreate = (async () => {
			let idx = await getIndexByNameOrFields(pouchRepo.db,indexName,indexFields)

			log.debug(`found index for finder ${finderKey}: ${idx && idx.name}/${indexName} with fields ${idx && idx.fields.join(',')}`)

			assert(idx || (indexFields && indexFields.length > 0),
				`No index found for ${indexName} and no indexFields provided`)

			if (!idx || idx.name === indexName) {
				idx = await makeMangoIndex(
					pouchRepo.store.db,
					pouchRepo.modelType.name,
					indexName || finderKey,
					indexDirection,
					indexFields || []
				)

				indexReady = true
			}

			return idx
		})()




	}

	const finder = async (...args) => {
		const selectorResult =
			isFunction(selector) ? selector(...args) : selector

		const result = await findWithSelector(
			pouchRepo,
			selectorResult,
			sort,
			limit

		)
		return mapDocs(pouchRepo.repo.modelClazz,result)

	}

	return async (...args) => {

		if (!indexReady) {
			log.debug(`Executing finder ${finderKey} with index ${indexName}`)
			const idx = await indexCreate
			log.debug('Index is Ready', idx)
		}
		return finder(...args)
	}

}