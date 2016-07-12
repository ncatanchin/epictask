import {User} from 'shared/models/User'
const log = getLogger(__filename)

import {RegisterModel} from 'shared/Registry'
import {Map,Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Repo, AvailableRepo,Comment,Issue} from 'shared/models'


export const RepoStateRecord = Record({
	repos:Map<string,Repo>(),
	users:Map<string,User>(),
	selectedRepoIds:[]
})

/**
 * Registry state
 *
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		return new RepoState(Object.assign({},o,{

		}))
	}


	selectedRepoIds:number[]

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
