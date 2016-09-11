import {RegisterModel} from 'shared/Registry'
import {Record} from 'immutable'
import {ActionMessage} from 'typedux'

const log = getLogger(__filename)

export const RepoStateRecord = Record({
	reposIds:[],
	enabledRepoIds:[],
	selectedRepoIds:[],
	availableRepoIds:[]
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

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
