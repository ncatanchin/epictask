import 'reflect-metadata'

/**
 * Repo State Holder
 */
import {
	RecordModel,
	RecordProperty,
	makeRecord
} from 'typemutant'

import {Repo} from '../../../shared/GitHubSchema'

import {Settings,Constants} from '../../../shared'

// export interface IAuthState {
// 	authenticated?:boolean
// 	username?:string
// 	email?:string
// 	token?:string
// 	authenticating?:boolean
// 	error?:Error
// }

@RecordModel()
class RepoStateModel {

	@RecordProperty()
	repos:Repo[]

	@RecordProperty()
	repo:Repo

	@RecordProperty()
	error:Error



	/**
	 * Set user repo list
	 *
	 * @param repos
	 * @returns {RepoStateModel}
	 */
	setRepos(repos:Repo[]) {
		this.repos = repos
		return this
	}


	setRepo(repo:Repo) {
		this.repo = repo
		return this
	}


	setError(err:Error) {
		this.error = err
		return this
	}

}



const RepoStateDefaults = {
	repos: Settings.repos
}

export const RepoState = makeRecord(RepoStateModel,RepoStateDefaults)
export type TRepoState = typeof RepoState