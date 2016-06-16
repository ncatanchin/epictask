import {PageLink, PageLinkType,PagedArray} from "./PagedArray"
import {Settings} from './Settings'
import * as GitHubSchema from 'shared/models'
import {Repo,Issue,User,Label,Milestone,Comment} from 'shared/models'
import {cloneObject} from 'shared/util'
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
	params?:any
	onPageCallback?:OnPageCallback<any>
}


/**
 * GitHubClient for remote
 * API access
 */
export class GitHubClient {

	constructor(private token:string) {
	}

	initRequest(method:HttpMethod,body = null,headers:any = {}) {
		const request:RequestInit = {
			method: HttpMethod[method],
			cache: "no-cache" as RequestCache,
			headers: Object.assign({
				Authorization: `token ${this.token}`
			},headers),
			mode: "cors" as RequestMode
		}

		if (body) request.body = body

		return request
	}

	async get<T>(path:string,modelType:any,opts:RequestOptions = null):Promise<T> { // | PagedArray<T>

		opts = _.merge({},DefaultGetOpts,opts)

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

		if (response.status >= 300) {
			throw new Error(response.statusText)
		}

		const headers = response.headers
		headers.forEach((value,name) => {
			log.debug(`Header (${name}): ${value}`)
		})

		let result = await response.json()

		if (Array.isArray(result)) {
			result = result.map(json => new (modelType)(json))
			const pageLinks = PageLink.parseLinkHeader(headers.get('link'))
			result = new PagedArray(
				result,
				page,
				pageLinks,
				headers.get('etag')
			)

			const lastLink = pageLinks[PageLinkType.last]
			if (opts.traversePages && result.length && !result.isLastPage && result.pageNumber === 0 && lastLink) {
				log.debug('Going to traverse pages',opts,pageLinks,result)

				// Because we are going to traverse, we should do a page callback first
				this.doPageCallback(opts,result.pageNumber,lastLink.pageNumber,result)

				let nextPageNumber = 0 //opts.page
				while (nextPageNumber < lastLink.pageNumber) {
					nextPageNumber++

					const nextOpts = Object.assign({},opts,{page:nextPageNumber})
					let nextResult = await this.get<T>(path,modelType,nextOpts) as T

					this.doPageCallback(opts,nextPageNumber,lastLink.pageNumber,nextResult)

					result.push(...(nextResult as any))
				}
			}
		} else {
			result = new (modelType)(result)
		}

		return result as any
	}

	private doPageCallback(opts:RequestOptions,pageNumber,totalPages,results) {
		if (opts.onPageCallback) {
			opts.onPageCallback(pageNumber,totalPages,results)
		}
	}


	async issueSave(repo:Repo,issue:Issue):Promise<Issue> {
		let issueJson = _.pick(issue,'title','body','state') as any
		if (!issueJson.state)
			issueJson.state = 'open'

		if (issue.assignee)
			issueJson.assignee == issue.assignee.login

		if (issue.labels && issue.labels.length) {
			issueJson.labels = issue.labels.map(label => label.name)
		}

		if (issue.milestone && issue.milestone.number) {
			issueJson.milestone = issue.milestone.number
		}

		const issueNumber = issue.number
		const [uri,method] = issueNumber ?
			[`/repos/${repo.full_name}/issues/${issueNumber}`,HttpMethod.PATCH] :
			[`/repos/${repo.full_name}/issues`,HttpMethod.POST]

		const response = await fetch(makeUrl(uri), this.initRequest(method,JSON.stringify(issueJson),{
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}))


		if (response.status >= 300) {
			let result = null
			try {
				result = await response.json()
			} catch (err) {
				log.error('Unable to get json error body',err)
				throw new Error(response.statusText)
			}

			throw new Error(result.message)

		}


		let result = await response.json()

		return _.merge(cloneObject(issue),result)

	}

	async user():Promise<User> {
		return await this.get<GitHubSchema.User>('/user',User)
	}

	async userRepos(opts:RequestOptions = null):Promise<PagedArray<GitHubSchema.Repo>> {
		return await this.get<PagedArray<Repo>>('/user/repos',Repo,opts)
	}


	async repo(repoName:string,opts:RequestOptions = null):Promise<GitHubSchema.Repo> {
		return await this.get<Repo>(`/repos/${repoName}`,Repo,opts)
	}

	/**
	 * Helper function for building paged gets with repo param
	 *
	 * @param model
	 * @param urlTemplate
	 * @returns {function(Repo, RequestOptions=): Promise<PagedArray<M>>}
	 */
	private makePagedRepoGetter<M>(modelType:{new():M;},urlTemplate:string) {
		return async (repo:Repo,opts:RequestOptions = null) => {
			const url = urlTemplate.replace(/<repoName>/g,repo.full_name)
			return await this.get<PagedArray<M>>(url,modelType,opts)
		}
	}

	/**
	 * Get all issues in repo
	 */
	repoIssues = this.makePagedRepoGetter(Issue,'/repos/<repoName>/issues')


	/**
	 * Get all collaborators for repo
	 */
	repoCollaborators = this.makePagedRepoGetter(User,'/repos/<repoName>/collaborators')

	/**
	 * Get all collaborators for repo
	 */
	repoContributors = this.makePagedRepoGetter(User,'/repos/<repoName>/contributors')

	/**
	 * Get all comments on an issue in a repo
	 */
	issueComments = async (repo:Repo,issue:Issue,opts:RequestOptions = null) => {
		const url = `/repos/${repo.full_name}/issues/${issue.id}/comments`
		return await this.get<PagedArray<Comment>>(url,Comment,opts)
	}

	/**
	 * All comments for all issues in a repo
	 *
	 * @param repo
	 * @param issue
	 * @param opts
	 * @returns {PagedArray<Comment>}
	 */
	repoComments = async (repo:Repo,opts:RequestOptions = null) => {
		const url = `/repos/${repo.full_name}/issues/comments`
		return await this.get<PagedArray<Comment>>(url,Comment,opts)
	}

	/**
	 * Get all labels in repo
	 */
	repoLabels = this.makePagedRepoGetter(Label,'/repos/<repoName>/labels')

	/**
	 * Get all milestones
	 */
	repoMilestones = this.makePagedRepoGetter(Milestone,'/repos/<repoName>/milestones')

}

export function createClient(token:string = null) {
	if (!token)
		token = Settings.token

	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}
