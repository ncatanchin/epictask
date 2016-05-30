
/**
 * Created by jglanz on 5/29/16.
 */

const log = getLogger(__filename)

// IMPORTS
import {ActionFactory,Action} from 'typedux'
import {RepoKey} from "../../../shared/Constants"
import {github} from '../../../shared'
import {RepoMessage,RepoState} from './index'
import {Repo} from 'epictask/shared/GitHubSchema'
/**
 * RepoActionFactory.ts
 *
 * @class RepoActionFactory.ts
 * @constructor
 **/

 export class RepoActionFactory extends ActionFactory<any,RepoMessage> {

	constructor() {
		super(RepoState)
	}

	leaf():string {
		return RepoKey;
	}

	@Action()
	setRepos(repos:Repo[]) {
	}

	@Action()
	setAvailableRepos(repos:Repo[]) {
	}

	@Action()
	getAvailableRepos() {
		return async (dispatch,getState) => {
			const actions = this.withDispatcher(dispatch,getState)

			const client = github.createClient()

			try {
				let repos = await client.userRepos({traversePages:true})
				log.info(`Received repos`,repos)
				actions.setAvailableRepos(repos)
			} catch (err) {
				log.error('Failed to get repos',err)
				actions.setError(err)
			}
		}
	}
 }