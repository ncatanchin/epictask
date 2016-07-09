import {Log,FinderRequest,FinderResultArray,isFunction} from 'typestore'
import {enableQuickSearch} from './PouchDBSetup'

import {
	IPouchDBFullTextFinderOptions, IPouchDBFilterFinderOptions, IPouchDBFnFinderOptions,
	IPouchDBMangoFinderOptions
} from './PouchDBDecorations'
import {PouchDBRepoPlugin} from './PouchDBRepoPlugin'
import {getIndexByNameOrFields, makeMangoIndex} from './PouchDBIndexes'
import {mapDocs, transformDocumentKeys, mapAttrsToField} from './PouchDBUtil'


const log = Log.create(__filename)

function makeFinderResults(pouchRepo,results,request,limit:number,offset:number,includeDocs:boolean) {
	const items = mapDocs(pouchRepo,pouchRepo.repo.modelClazz,results,includeDocs)
	const total = results.total_rows || items.length
	return new FinderResultArray(items as any,total,request,results.metadata || [])
}

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
	return result.rows.reduce((finalResults,nextRow) => {
		const val = (includeDocs) ? nextRow.doc : nextRow.id

		finalResults.docs.push(val)
		finalResults.metadata.push({score:nextRow.score})

		return finalResults
	},{
		docs:[],
		metadata:[]
	})
}




export function findWithSelector(pouchRepo:PouchDBRepoPlugin<any>, selector,sort = null,limit = -1,offset = -1,includeDocs = true) {

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

	if (!includeDocs)
		opts.fields = mapAttrsToField([pouchRepo.primaryKeyField])

	log.debug('findWithSelector, selector',selector,'opts',JSON.stringify(opts,null,4))

	return pouchRepo.db.find(opts)
}



export function makeFullTextFinder(pouchRepo:PouchDBRepoPlugin<any>,finderKey:string,opts:IPouchDBFullTextFinderOptions) {
	enableQuickSearch()
	let {textFields,queryMapper,build,minimumMatch,limit,offset,includeDocs} = opts

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

	return async (request:FinderRequest,...args) => {
		await buildIndexPromise

		const query = (queryMapper) ?
			queryMapper(...args) :
			args[0]

		// Update params with the request if provided
		if (request) {
			offset = request.offset || offset
			limit = request.limit || limit
			includeDocs = (typeof request.includeModels === 'boolean') ?
				request.includeModels :
				includeDocs
		}

		const results = await findWithText(
			pouchRepo,query,textFields,limit,offset,includeDocs
		)

		log.debug('Full text result for ' + finderKey ,results,'args',args)

		return makeFinderResults(pouchRepo,results,request,limit,offset,includeDocs)



	}
}

export function makeFilterFinder(pouchRepo:PouchDBRepoPlugin<any>,finderKey:string,opts:IPouchDBFilterFinderOptions) {
	log.warn(`Finder '${finderKey}' uses allDocs filter - THIS WILL BE SLOW`)

	const {filter} = opts

	return async (request:FinderRequest,...args) => {
		const allModels = await pouchRepo.all()
		return allModels.filter((doc) => filter(doc,...args))
	}
}

export function makeFnFinder(pouchRepo:PouchDBRepoPlugin<any>,finderKey:string,opts:IPouchDBFnFinderOptions) {
	const {fn} = opts

	return async (request:FinderRequest,...args) => {
		const result = await fn(pouchRepo, ...args)
		return makeFinderResults(pouchRepo,result,request,opts.limit,opts.offset,opts.includeDocs)
	}
}

export function makeMangoFinder(pouchRepo:PouchDBRepoPlugin<any>,finderKey:string,opts:IPouchDBMangoFinderOptions) {
	let {selector,sort,limit,offset,includeDocs,all,indexName,indexDirection,indexFields} = opts

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

	const finder = async (request:FinderRequest,...args) => {
		const selectorResult =
			isFunction(selector) ? selector(...args) : selector

		if (request) {
			offset = request.offset || offset
			limit = request.limit || limit
			includeDocs = (typeof request.includeModels === 'boolean') ?
				request.includeModels :
				includeDocs
		}

		const result = await findWithSelector(
			pouchRepo,
			selectorResult,
			sort,
			limit,
			offset,
			includeDocs
		)

		return makeFinderResults(pouchRepo,result,request,limit,offset,includeDocs)

	}

	return async (request:FinderRequest,...args) => {

		if (!indexReady) {
			log.debug(`Executing finder ${finderKey} with index ${indexName}`)
			const idx = await indexCreate
			log.debug('Index is Ready', idx)
		}
		return finder(request,...args)
	}

}