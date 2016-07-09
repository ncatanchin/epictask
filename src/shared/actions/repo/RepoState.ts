import {User} from 'shared/models/User'
const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Map,List,Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Repo, AvailableRepo,Comment,Issue} from 'shared/models'

export const RepoStateRecord = Record({
	issues:Map<string,Issue>(),
	comments:Map<string,Comment>(),
	repos:Map<string,Repo>(),
	users:Map<string,User>(),
	error:null
})

/**
 * Registry state
 *
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		return new RepoState(Object.assign({},o,{
			repos: List(o.stores),
			availableRepos: Map(o.availableRepos),
			comments: Map(o.comments),
			issues: Map(o.issues),
			users: Map(o.users),
		}))
	}


	availableRepos: Map<string,AvailableRepo>
	issues:Map<string,Issue>
	comments:Map<string,Comment>
	repos:Map<string,Repo>
	error:Error

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
