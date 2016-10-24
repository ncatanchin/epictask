import {RegisterModel} from "epic-global"
import {Record,List,Map} from 'immutable'
import {ActionMessage} from 'typedux'
import { AvailableRepo } from "epic-models"
import { reviveImmutable } from  "epic-common"

const
	log = getLogger(__filename)


/**
 * Repo State Record
 */
export const RepoStateRecord = Record({
	reposIds:[],
	availableRepos:List<AvailableRepo>(),
	selectedRepoIds:[],
	reposLoading:Map<number,boolean>()
})

/**
 * Repository State
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		return reviveImmutable(o,RepoState,['availableRepos'])
	}
	
	// toJS() {
	// 	return {
	// 		selectedRepoIds: this.selectedRepoIds,
	// 		availableRepos: _.toJS(this.availableRepos)
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
