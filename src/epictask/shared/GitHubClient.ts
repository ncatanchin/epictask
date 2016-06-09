import {PageLink, PageLinkType,PagedArray} from "./PagedArray"
import {Settings} from './Settings'
import * as GitHubSchema from 'shared/models'
import {Repo,Issue,User} from 'shared/models'
const {URLSearchParams} = require('urlsearchparams')

const log = getLogger(__filename)
const hostname = 'https://api.github.com'

function makeUrl(path:string,query:any = null) {
	let url = `${hostname}${path}`
	if (query)
		url += `?${query.toString()}`

	return url

}

const DefaultGetOpts ={
	traversePages:true,
	page:0
}

enum HttpMethod {
	GET,
	POST,
	PUT,
	PATCH,
	DELETE
}

export type OnPageCallback<M> = (pageNumber:number,totalPages:number,pageItems:M[]) => void

export interface RequestOptions {
	traversePages?:boolean
	perPage?:number
	page?:number
	params?:number
	onPageCallback?:OnPageCallback<any>
}


/**
 * GitHubClient for remote
 * API access
 */
export class GitHubClient {

	constructor(private token:string) {
	}

	initRequest(method:HttpMethod,body = null) {
		const request:RequestInit = {
			method: HttpMethod[method],
			cache: "no-cache" as RequestCache,
			headers: {
				Authorization: `token ${this.token}`
			},
			mode: "cors" as RequestMode
		}

		if (body) request.body = body

		return request
	}

	async get<T>(path:string,opts:RequestOptions = {}):Promise<T> { // | PagedArray<T>
		// Built search query
		const query = new URLSearchParams()
		const page = opts.page || 0
		const perPage = opts.perPage || 50
		query.append('page',page)
		query.append('per_page',perPage)

		if (opts.params)
			Object.keys(opts.params)
				.forEach(key => query.append(key,opts.params[key]))

		let response =  await fetch(makeUrl(path,query),this.initRequest(HttpMethod.GET))

		const headers = response.headers
		headers.forEach((value,name) => {
			log.debug(`Header (${name}): ${value}`)
		})


		let result = await response.json()
		if (Array.isArray(result)) {
			const pageLinks = PageLink.parseLinkHeader(headers.get('link'))
			result = new PagedArray(
				result,
				page,
				pageLinks,
				headers.get('etag')
			)

			const lastLink = pageLinks[PageLinkType.last]
			if (result.length && !result.isLastPage && result.pageNumber === 0 && lastLink) {
				log.debug('Going to traverse pages',opts,pageLinks,result)

				let nextPage = 0 //opts.page
				while (nextPage < lastLink.pageNumber) {
					nextPage++

					const nextOpts = Object.assign({},opts,{page:nextPage})
					let nextResult = await this.get<T>(path,nextOpts) as T
					result.push(...(nextResult as any))
				}
			}
		}

		return result as any
	}


	async user():Promise<User> {
		return await this.get<GitHubSchema.User>('/user')
	}

	async userRepos(opts:RequestOptions = DefaultGetOpts):Promise<PagedArray<GitHubSchema.Repo>> {
		return await this.get<PagedArray<Repo>>('/user/repos',opts)
	}


	/**
	 * Helper function for building paged gets with repo param
	 *
	 * @param model
	 * @param urlTemplate
	 * @returns {function(Repo, RequestOptions=): Promise<PagedArray<M>>}
	 */
	private makePagedRepoGetter<M>(model:{new():M;},urlTemplate:string) {
		return async (repo:Repo,opts:RequestOptions = DefaultGetOpts) => {
			const url = urlTemplate.replace(/<repoName>/g,repo.full_name)
			return await this.get<PagedArray<M>>(url,opts)
		}
	}

	/**
	 * Get all issues in repo
	 */
	repoIssues = this.makePagedRepoGetter(Issue,'/repos/<repoName>/issues')

	/**
	 * Get all labels in repo
	 */
	repoLabels = this.makePagedRepoGetter(Issue,'/repos/<repoName>/labels')

	/**
	 * Get all milestones
	 */
	repoMilestones = this.makePagedRepoGetter(Issue,'/repos/<repoName>/milestones')

}

export function createClient(token:string = null) {
	if (!token)
		token = Settings.token

	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}
