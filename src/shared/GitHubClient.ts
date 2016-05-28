import * as Settings from './Settings'
import * as Constants from './Constants'
import * as request from 'superagent'

const host = 'https://api.github.com'

class GitHubClient {

	constructor(private token:string) {
	}

	get<T>(path:string):Promise<T> {
		return new Promise<T>((resolve,reject) => {
			request.get(`${host}${path}`)
				.set('Authorization',`token ${this.token}`)
				.end((err,res) => {
					if (err)
						return reject(err)

					resolve(res.body)
				})
		})
	}

	async user():Promise<GitHubObjects.User> {
		return await this.get<GitHubObjects.User>('/user')
	}

}

export function createClient(token:string = null) {
	if (!token)
		token = Settings.get<string>(Constants.GitHubToken)

	if (!token)
		throw new Error('No valid token available')

	return new GitHubClient(token)
}