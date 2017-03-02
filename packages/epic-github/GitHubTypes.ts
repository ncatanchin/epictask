

import { Repo } from "epic-models"

export enum HttpMethod {
	GET,
	POST,
	PUT,
	PATCH,
	DELETE
}

export interface IGithubValidationError {
	resource:string
	field:string
	code:string
}

export const GithubErrorCodes = {
	missing: 'Resource can not be found',
	missing_field: 'Field is required',
	invalid: 'Invalid format',
	already_exists: 'Duplicate resource'
}

/**
 * GitHub Client Error
 */
export class GithubError extends Error {
	constructor(
		public message:string,
		public statusCode:number,
		public errors:IGithubValidationError[] = []
	) {
		super(message)
	}
}

/**
 * If a callback returns FALSE - Nil/Null is ignored - then paging stops
 */
export type OnDataCallback<M> = (pageNumber:number, totalPages:number, items:M[], responseHeaders?:{[headerName:string]:any}) => any

/**
 * Request options for any/all API Requests
 */
export interface RequestOptions {
	traversePages?:boolean
	
	/**
	 * Reverse ONLY applies when traverse is enabled,
	 * it collects the first page, then collects the others from the end to
	 * the beginning
	 *
	 * Finally appending the first page it received to the beginning
	 *
	 */
	reverse?:boolean
	
	/**
	 * Max number of retries, null === 0, or no retries
	 */
	retryMax?:number
	
	/**
	 * Retry timeout in milliseconds, delay between failure and retry
	 */
	retryTimeout?:number
	
	/**
	 * Retry timeout is multiplied by this value on each successive attempt, "backoff"
	 */
	retryTimeoutMultiplier?:number
	
	/**
	 * Items per page
	 */
	perPage?:number
	
	/**
	 * Current page
	 */
	page?:number
	
	/**
	 * Key/Value pairs of params
	 */
	params?:any
	
	/**
	 * eTag to use
	 */
	eTag?:string
	
	/**
	 * On data received callback
	 */
	onDataCallback?:OnDataCallback<any>
}

/**
 * Search results wrapper
 */
export class GithubSearchResults<T> {
	
	total_count:number
	incomplete_results:boolean
	items:T[]
	
	/**
	 * Accepts the json results and a model type
	 *
	 * @param results
	 * @param modelType
	 */
	constructor(results,public modelType:{new():T}) {
		Object.assign(this,_.omit(results,'items'))
		
		this.items = !results.items ? [] :
			results.items.map(it => new (modelType as any)(it))
	}
}

/**
 * Repo search results
 */
export class GithubRepoSearchResults extends GithubSearchResults<Repo> {
	
	constructor(results) {
		super(results,Repo)
	}
}
