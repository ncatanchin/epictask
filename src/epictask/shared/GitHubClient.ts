const log = getLogger(__filename)
import {Settings} from './Settings'
import * as GitHubSchema from './GitHubSchema'
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

	async get<T>(path:string):Promise<T> {
		let response =  await fetch(makeUrl(path),this.initRequest(HttpMethod.GET))

		const headers = response.headers
		headers.forEach((value,name) => {
			log.debug(`Header (${name}): ${value}`)
		})

		return await response.json()
	}

	async user():Promise<GitHubSchema.User> {
		return await this.get<GitHubSchema.User>('/user')
	}

	async userRepos():Promise<GitHubSchema.Repo[]> {
		return await this.get<GitHubSchema.Repo[]>('/user/repos')
	}

}

export function createClient(token:string = null) {
	if (!token)
		token = Settings.token

	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}