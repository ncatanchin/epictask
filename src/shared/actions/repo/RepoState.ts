import {RegisterModel} from 'shared/Registry'
import {Record} from 'immutable'
import {ActionMessage} from 'typedux'
import { AvailableRepo, Milestone, User, Label } from "shared/models"

const log = getLogger(__filename)

export const RepoStateRecord = Record({
	reposIds:[],
	enabledRepoIds:[],
	selectedRepoIds:[],
	availableRepoIds:[],
	availableRepos:[],
	enabledMilestones:[],
	enabledAssignees:[],
	enabledLabels:[]
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
	
	enabledMilestones:Milestone[]
	enabledAssignees:User[]
	enabledLabels:Label[]

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
