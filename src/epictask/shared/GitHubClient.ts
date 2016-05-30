import {PageLink, PageLinkType,PagedArray} from "./PagedArray"
import {Settings} from './Settings'
import * as GitHubSchema from './GitHubSchema'
const {URLSearchParams} = require('urlsearchparams')

const log = getLogger(__filename)
const hostname = 'https://api.github.com'

function makeUrl(path:string) {
	return `${hostname}${path}`
}

enum HttpMethod {
	GET,
	POST,
	PUT,
	PATCH,
	DELETE
}

export interface RequestOptions {
	traversePages?:boolean
	perPage?:number
	page?:number
	params?:number
}


/**
 * GitHubClient for remote
 * API access
 */
export class GitHubClient {

	constructor(private token:string) {
	}

	initRequest(method:HttpMethod) {
		return {
			method: HttpMethod[method],
			cache: "no-cache" as RequestCache,
			headers: {
				Authorization: `token ${this.token}`
			},
			mode: "cors" as RequestMode
		}
	}

	async get<T>(path:string,opts:RequestOptions = {}):Promise<T> { // | PagedArray<T>
		let response =  await fetch(makeUrl(path),this.initRequest(HttpMethod.GET))

		const headers = response.headers
		headers.forEach((value,name) => {
			log.debug(`Header (${name}): ${value}`)
		})

		// Built search query
		const query = new URLSearchParams()
		if (opts.page)
			query.append('page',opts.page)

		if (opts.perPage)
			query.append('per_page',opts.perPage)

		if (opts.params)
			Object.keys(opts.params)
				.forEach(key => query.append(key,opts.params[key]))


		let result = await response.json()
		if (Array.isArray(result)) {
			const pageLinks = PageLink.parseLinkHeader(headers.get('link'))
			result = new PagedArray(
				result,
				opts.page || 0,
				pageLinks,
				headers.get('etag')
			)

			const lastLink = pageLinks[PageLinkType.last]
			if (result.length && !result.isLastPage && opts.page === 0 && lastLink) {
				log.info('Going to traverse pages',opts,pageLinks,result)

				let page = opts.page
				while (page < lastLink.pageNumber) {
					page++
					const nextOpts = Object.assign({},opts,{page})
					let nextResult = await this.get<T>(path,nextOpts) as T
					result.push(...(nextResult as any))
				}
			}
		}

		return result as any
	}

	async user():Promise<GitHubSchema.User> {
		return await this.get<GitHubSchema.User>('/user')
	}


	async userRepos(opts:RequestOptions = {traversePages:false,page:0}):Promise<PagedArray<GitHubSchema.Repo>> {
		const {traversePages,page} = opts

		return await this.get<PagedArray<GitHubSchema.Repo>>('/user/repos',{traversePages,page})
	}
}

export function createClient(token:string = null) {
	if (!token)
		token = Settings.token

	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}