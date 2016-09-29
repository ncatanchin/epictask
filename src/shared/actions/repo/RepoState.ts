import {RegisterModel} from 'shared/Registry'
import {Record,List} from 'immutable'
import {ActionMessage} from 'typedux'
import { AvailableRepo, Milestone, User, Label } from "shared/models"
import { cloneObject } from "shared/util/ObjectUtil"

const log = getLogger(__filename)

export const RepoStateRecord = Record({
	reposIds:[],
	availableRepos:List<AvailableRepo>(),
	selectedRepoIds:[]
	
})

/**
 * Registry state
 *
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		if (o && o.availableRepos && !List.isList(o.availableRepos)) {
			if (o.withMutations) {
				o = o.set('availableRepos',List(o.availableRepos))
			} else {
				o.availableRepos = List(o.availableRepos)
			}
		}
		
		let
			instance:RepoState = o && o instanceof RepoState ? o : new RepoState(
				Object.assign({},o)
			)
		
		if (!instance.availableRepos)
			instance = instance.set('availableRepos',List()) as any
		
		return instance
		
		
	}
	
	// toJS() {
	// 	return {
	// 		ava
	// 	}
	// }
	
	selectedRepoIds:number[]
	availableRepos:List<AvailableRepo>

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
