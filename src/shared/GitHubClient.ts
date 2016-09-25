import {Container} from 'typescript-ioc'

import {PageLink, PageLinkType,PagedArray} from "./PagedArray"
import {getSettings} from 'shared/settings/Settings'
import * as GitHubSchema from 'shared/models'
import {Repo,Issue,User,Label,Milestone,Comment} from 'shared/models'
import { cloneObject, isString, isNumber, toNumber } from 'shared/util/ObjectUtil'
import {IssuesEvent,RepoEvent} from 'shared/models/GitHubEvents'
import {List} from 'immutable'
import { getToaster, addInfoMessage, addErrorMessage } from "shared/Toaster"
 

const
	APIRateLimit = 250,
	APIRateLimitDuration = 60000,
	{URLSearchParams} = require('urlsearchparams'),
	PageIntervalDelay = 500,
	log = getLogger(__filename),
	hostname = 'https://api.github.com'

let
	APICallHistory = List<any>(),
	githubRateLimitInfo:any



function makeUrl(path:string,query:any = null) {
	let url = `${hostname}${path}`
	if (query)
		url += `?${query.toString()}`

	return url

}

/**
 * Wraps fetch function to monitor rate limiting
 *
 * @param url
 * @param args
 * @returns {any}
 */
const doFetch:typeof fetch = async (url,...args) => {
	if (APICallHistory.size > APIRateLimit) {
		APICallHistory = APICallHistory.filter(apiCall => apiCall.timestamp > Date.now() - APIRateLimitDuration) as List<any>
		
		if (APICallHistory.size > APIRateLimit) {
			log.error(`Local rate limit exceeded: ${APICallHistory.size}`, APICallHistory.toArray())
			addErrorMessage(`Overrate limit ${APICallHistory.size} in ${APIRateLimitDuration / 1000}s`)
			
			throw new Error(`Overrate limit ${APICallHistory.size} in ${APIRateLimitDuration / 1000}s`)
		}
	}
	
	
	APICallHistory.push({
		url,
		timestamp: Date.now()
	})
	
	const
		response = await (fetch as any)(url,...args),
		{headers} = response
	
	let
		rateLimit = toNumber(headers.get('X-RateLimit-Limit'))
	
	if (rateLimit) {
		const
			rateLimitRemaining = toNumber(headers.get('X-RateLimit-Remaining')),
			rateLimitResetTimestamp = toNumber(headers.get('X-RateLimit-Reset')) * 1000
		
		githubRateLimitInfo = {
			rateLimit,
			rateLimitRemaining,
			rateLimitResetTimestamp
		}
		
		if (rateLimit - rateLimitRemaining > (rateLimit / 3) * 2)
			addInfoMessage(`Github Rate Limit is less than 50%, limit=${rateLimit} remaining=${rateLimitRemaining} resets @ ${new Date(rateLimitResetTimestamp)}`)
		
	}
	
	return response
}

/**
 * Get github rate limit info
 *
 * @returns {any}
 */
export function getGithubRateLimitInfo() {
	return githubRateLimitInfo
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

/**
 * If a callback returns FALSE - Nil/Null is ignored - then paging stops
 */
export type OnDataCallback<M> = (pageNumber:number, totalPages:number, items:M[], responseHeaders?:{[headerName:string]:any}) => any

/**
 * Request options for any/all API Requests
 */
export interface RequestOptions {
	traversePages?:boolean
	perPage?:number
	page?:number
	params?:any
	eTag?:string
	onDataCallback?:OnDataCallback<any>
}


/**
 * GitHubClient for remote
 * API access
 */
export class GitHubClient {

	constructor(private token:string = null) {
		if (!token) {
			//this.token = require('shared/settings/Settings').getSettings().token
			this.token = getSettings().token
		}
	}
	
	
	
	private makeGetHeaders(opts:RequestOptions) {
		const
			headers = {}
			
		if (opts.eTag) {
			headers['If-None-Match'] = opts.eTag
		}
		
		return headers
	}
	
	
	/**
	 * Initialize request
	 *
	 * @param method
	 * @param body
	 * @param headers
	 * @returns {RequestInit}
	 */
	private initRequest(method:HttpMethod,body = null,headers:any = {}) {
		const
			request:RequestInit = {
				method: HttpMethod[method],
				cache: "no-cache" as RequestCache,
				headers: Object.assign({
					Authorization: `token ${this.token}`
				},headers),
				mode: "cors" as RequestMode
			}

		if (body)
			request.body = body

		return request
	}
	
	
	getRateLimitInfo() {
		return githubRateLimitInfo
	}
	
	getRateLimitInfoAsString() {
		const
			info = githubRateLimitInfo
		
		return `limit=${info.rateLimit},remaining=${info.rateLimitRemaining},resets=${new Date(info.rateLimitResetTimestamp)}`
	}
	
	async get<T>(path:string,modelType:any,opts:RequestOptions = null):Promise<T> { // | PagedArray<T>

		opts = _.merge({},DefaultGetOpts,opts)

		// Built search query
		const
			query = new URLSearchParams(),
			page = opts.page || 0,
			perPage = opts.perPage || 50
			
		
		query.append('page',page)
		query.append('per_page',perPage)

		
		if (opts.params)
			Object.keys(opts.params)
				.forEach(key => query.append(key,opts.params[key]))
		
		let
			url = makeUrl(path,query),
			response =  await doFetch(url,this.initRequest(HttpMethod.GET,null,this.makeGetHeaders(opts)))

		if (response.status >= 300) {
			throw new GithubError(
				response.statusText,
				response.status
			)
		}

		const
			headers = response.headers
		
		headers.forEach((value,name) => {
			log.debug(`Header (${name}): ${value}`)
		})

		let
			result = await response.json()

		if (Array.isArray(result)) {
			result = result.map(json => new (modelType)(json))
			
			const
				pageLinks = PageLink.parseLinkHeader(headers.get('link'))
			
			result = new PagedArray(
				result,
				page,
				pageLinks,
				headers.get('etag')
			)
			
			const
				// FINAL PAGE LINK
				lastLink = pageLinks[ PageLinkType.last ],
			
				// CHECK RESULT IS TYPE BOOLEAN === false TO STOP TRAVERSING
				checkDataCallback = (dataCallbackResult) => {
					if (dataCallbackResult === false) {
						log.info(`Data callback returned false - not going to page`)
						return false
					}
					
					return true
				}
			
			
			// TRAVERSE PAGES -or- RETURN SINGLE RESULT
			if (opts.traversePages && result.length) {
				log.debug('Going to traverse pages', opts, pageLinks)
				
				// CHECK CALLBACK RESULT / false=skip
				if (checkDataCallback(
					this.doDataCallback(
						opts,
						result.pageNumber,
						lastLink ? lastLink.pageNumber : result.pageNumber,
						result,
						headers
					))
				) {
						
						// Page counter / opts.page
					let nextPageNumber = result.pageNumber + 1
					
					// Iterate all pages
					while (lastLink && nextPageNumber < lastLink.pageNumber && !result.isLastPage) {
						nextPageNumber++
						
						log.info(`Getting page number ${nextPageNumber} of ${lastLink.pageNumber}`)
						
						// Delay by 1s in-between page requests
						await Promise.resolve(true).delay(PageIntervalDelay)
						
						const
							nextOpts = Object.assign({}, opts, { page: nextPageNumber }),
							nextResult = await this.get<T>(path, modelType, nextOpts) as T
						
						
						result.push(...(nextResult as any))
						
						// CHECK CALLBACK RESULT / false=break
						if (checkDataCallback(
							this.doDataCallback(
								opts,
								nextPageNumber,
								lastLink.pageNumber,
								nextResult,headers
							))
						)
							break
					}
				}
			}
		} else {
			result = new (modelType)(result)
			
			// Do data callback no matter what
			this.doDataCallback(opts, 0, 1, [ result ],headers)
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
	private doDataCallback(opts:RequestOptions, pageNumber:number, totalPages:number, results,headers) {
		if (opts.onDataCallback) {
			 return opts.onDataCallback(pageNumber,totalPages,results,headers)
		}
		
		return null
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
			response = await doFetch(makeUrl(uri), this.initRequest(method,payload,{
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
			response = await doFetch(makeUrl(uri), this.initRequest(method,null,{
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

		const response = await doFetch(makeUrl(uri), this.initRequest(method,issuePayload,{
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
	
	
	// async repoEvents(repoName:Repo|string,eTag:string = null):Promise<PagedArray<GithubEvents.RepoEvent>> {
	// 	return await this.get<PagedArray<GithubEvents.RepoEvent>>(`/repos/${isString(repoName) ? repoName : repoName.full_name}/events`,Repo,opts)
	// }
	
	
	/**
	 * Get issue events
	 */
	issuesEvents = this.makePagedRepoGetter(IssuesEvent,'/repos/<repoName>/issues/events')
	
	/**
	 * Get repo events, you should pass an eTag
	 */
	repoEvents = this.makePagedRepoGetter(RepoEvent,'/repos/<repoName>/events')
	
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
	if (process.env.EPIC_CLI && !token) {
		if (DEBUG) {
			token = process.env.EPIC_GITHUB_API_TOKEN || process.env.GITHUB_API_TOKEN
			log.info(`Using API token ${token}`)
		}
	}
	
	if (!token)
		token = getSettings().token

	// If not set and env var exists then use it
	//token = token ||	process.env.GITHUB_API_TOKEN
		
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
		getGithubRateLimitInfo,
		GitHubClient
	})
}


Container.bind(GitHubClient).provider({ get: () => createClient()})