import {Container} from 'typescript-ioc'

import {PageLink, PageLinkType,PagedArray} from "./PagedArray"
import {getSettings} from 'shared/Settings'
import * as GitHubSchema from 'shared/models'
import {Repo,Issue,User,Label,Milestone,Comment} from 'shared/models'
import { cloneObject, isString, isNumber } from 'shared/util/ObjectUtil'


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

export type OnDataCallback<M> = (pageNumber:number, totalPages:number, items:M[]) => void

/**
 * Request options for any/all API Requests
 */
export interface RequestOptions {
	traversePages?:boolean
	perPage?:number
	page?:number
	params?:any
	onDataCallback?:OnDataCallback<any>
}


/**
 * GitHubClient for remote
 * API access
 */
export class GitHubClient {

	constructor(private token:string = getSettings().token) {

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

		const url = makeUrl(path,query)
		let response =  await fetch(url,this.initRequest(HttpMethod.GET))

		if (response.status >= 300) {
			throw new Error(response.statusText || 'GH Returned error: ' + response.status)
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
			
			// Because we are going to traverse, we should do a page callback first
			this.doDataCallback(opts,result.pageNumber,lastLink ? lastLink.pageNumber : result.pageNumber,result)
			
			if (opts.traversePages && result.length && !result.isLastPage && result.pageNumber === 0 && lastLink) {
				log.debug('Going to traverse pages',opts,pageLinks)

				
				// Page counter / opts.page
				let nextPageNumber = 1
				
				// Iterate all pages
				while (nextPageNumber < lastLink.pageNumber) {
					nextPageNumber++
					
					log.info(`Getting page number ${nextPageNumber} of ${lastLink.pageNumber}`)

					await Promise.resolve(true).delay(1000)
					
					const
						nextOpts = Object.assign({},opts,{page:nextPageNumber}),
						nextResult = await this.get<T>(path,modelType,nextOpts) as T

					this.doDataCallback(opts,nextPageNumber,lastLink.pageNumber,nextResult)

					result.push(...(nextResult as any))
				}
			}
		} else {
			result = new (modelType)(result)
			
			// Do data callback no matter what
			this.doDataCallback(opts,0,1,[result])
		}

		return result as any
	}
	
	/**
	 * Do data callback if provided
	 *
	 * @param opts
	 * @param pageNumber
	 * @param totalPages
	 * @param results
	 */
	private doDataCallback(opts:RequestOptions, pageNumber, totalPages, results) {
		if (opts.onDataCallback) {
			opts.onDataCallback(pageNumber,totalPages,results)
		}
	}

	/**
	 * Save comment
	 *
	 * @param repo
	 * @param issue
	 * @param comment
	 * @returns {any}
	 */
	async commentSave(repo:Repo,issue:Issue,comment:Comment):Promise<Comment> {
		let json = _.pick(comment,'body') as any


		const
			commentId = comment.id,
			issueNumber = issue.number,
			[uri,method] = commentId ?
				[`/repos/${repo.full_name}/issues/comments/${comment.id}`,HttpMethod.PATCH] :
				[`/repos/${repo.full_name}/issues/${issueNumber}/comments`,HttpMethod.POST]

		const
			payload = JSON.stringify(json),
			response = await fetch(makeUrl(uri), this.initRequest(method,payload,{
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}))


		if (response.status >= 300) {
			let result = null

			try {
				result = await response.json()
			} catch (err) {
				log.error('Unable to get json error body',err)
			}

			throw new GithubError(
				_.get(result,'message',response.statusText),
				response.status,
				result && result.errors
			)

		}


		let result = await response.json()

		return _.merge(cloneObject(comment),result)

	}
	
	
	/**
	 * Delete comment
	 *
	 * @param repo
	 * @param issue
	 * @param comment
	 * @returns {any}
	 */
	async commentDelete(repo:Repo,comment:Comment):Promise<void> {
		let json = _.pick(comment,'body') as any
		
		
		const
			commentId = comment.id,
			[uri,method] = [`/repos/${repo.full_name}/issues/comments/${comment.id}`,HttpMethod.DELETE]
		
		const
			response = await fetch(makeUrl(uri), this.initRequest(method,null,{
				'Accept': 'application/json'
			}))
		
		
		if (response.status >= 300) {
			let result = null
			
			try {
				result = await response.json()
			} catch (err) {
				log.error('Unable to get json error body',err)
			}
			
			throw new GithubError(
				_.get(result,'message',response.statusText),
				response.status,
				result && result.errors
			)
			
		}
		
	}

	/**
	 * Save issue
	 *
	 * @param repo
	 * @param issue
	 * @returns {any}
	 */
	async issueSave(repo:Repo,issue:Issue):Promise<Issue> {
		let issueJson = _.pick(issue,'title','body','state') as any
		if (!issueJson.state)
			issueJson.state = 'open'

		if (issue.assignee)
			issueJson.assignees = [issue.assignee.login]
		else
			issueJson.assignees = []

		if (issue.labels) {
			issueJson.labels = issue.labels.map(label => label.name)
		}

		if (issue.milestone && issue.milestone.number) {
			issueJson.milestone = issue.milestone.number
		} else {
			issueJson.milestone = null
		}

		const
			issueNumber = issue.number,
			[uri,method] = issueNumber ?
				[`/repos/${repo.full_name}/issues/${issueNumber}`,HttpMethod.PATCH] :
				[`/repos/${repo.full_name}/issues`,HttpMethod.POST]

		const issuePayload = JSON.stringify(issueJson)

		const response = await fetch(makeUrl(uri), this.initRequest(method,issuePayload,{
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}))


		if (response.status >= 300) {
			let result = null

			try {
				result = await response.json()
			} catch (err) {
				log.error('Unable to get json error body',err)
			}

			throw new GithubError(
				_.get(result,'message',response.statusText),
				response.status,
				result && result.errors
			)

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
	
	async issue(repoName:string,issueNumber:number,opts:RequestOptions = null):Promise<GitHubSchema.Issue> {
		return await this.get<Issue>(`/repos/${repoName}/issues/${issueNumber}`,Issue,opts)
	}
	
	
	/**
	 * Helper function for building paged gets with repo param
	 *
	 * @param modelType
	 * @param urlTemplate
	 * @param defaultRequestOptions
	 * @returns {function(Repo, RequestOptions=): Promise<PagedArray<M>>}
	 */
	private makePagedRepoGetter<M>(
		modelType:{new():M;},
		urlTemplate:string,
		defaultRequestOptions:RequestOptions = null
	) {
		return async (repo:Repo|string,opts:RequestOptions = null) => {
			
			const
				repoName = isString(repo) ? repo : repo.full_name,
				url = urlTemplate.replace(/<repoName>/g,repoName)

			if (defaultRequestOptions) {
				opts = _.merge({},_.cloneDeep(defaultRequestOptions),opts)
			}

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
	repoAssignees = this.makePagedRepoGetter(User,'/repos/<repoName>/assignees')

	/**
	 * Get all collaborators for repo
	 */
	repoContributors = this.makePagedRepoGetter(User,'/repos/<repoName>/contributors')

	/**
	 * Get all comments on an issue in a repo
	 */
	issueComments = async (repo:Repo|string,issue:Issue|number,opts:RequestOptions = null) => {
		const
			repoName = isString(repo) ? repo : repo.full_name,
			issueNumber = isNumber(issue) ? issue : issue.number,
			url = `/repos/${repoName}/issues/${issueNumber}/comments`
		
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

// Create a new GitHubClient
export function createClient(token:string = null) {
	if (!token)
		token = getSettings().token

	// If not set and env var exists then use it
	token = token ||	process.env.GITHUB_API_TOKEN
		
	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}

if (DEBUG) {
	assignGlobal({
		getGithubClient() {
			log.info(`You should be in DEBUG mode`)
			
			return createClient()
		},
		GitHubClient
	})
}


Container.bind(GitHubClient).provider({ get: () => createClient()})