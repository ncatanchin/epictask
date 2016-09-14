import {RegisterModel} from 'shared/Registry'
import {Record} from 'immutable'
import {ActionMessage} from 'typedux'
import { AvailableRepo } from "shared/models"

const log = getLogger(__filename)

export const RepoStateRecord = Record({
	reposIds:[],
	enabledRepoIds:[],
	selectedRepoIds:[],
	availableRepoIds:[],
	availableRepos:[]
})

/**
 * Registry state
 *
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		if (o && o instanceof RepoState)
			return o
		
		return new RepoState(Object.assign({},o))
	}

	repoIds:number[]
	availableRepoIds:string[]
	enabledRepoIds:number[]
	selectedRepoIds:number[]
	availableRepos:AvailableRepo[]

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
