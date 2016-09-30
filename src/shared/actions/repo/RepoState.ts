import {RegisterModel} from 'shared/Registry'
import {Record,List,Map} from 'immutable'
import {ActionMessage} from 'typedux'
import { AvailableRepo, Milestone, User, Label } from "shared/models"
import { cloneObject } from "shared/util/ObjectUtil"

const log = getLogger(__filename)

export const RepoStateRecord = Record({
	reposIds:[],
	availableRepos:List<AvailableRepo>(),
	selectedRepoIds:[],
	reposLoading:Map<number,boolean>()
})

/**
 * Registry state
 *
 */
@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		if (o) {
			if (o.withMutations) {
				if (!List.isList(o.availableRepos))
					o = o.set('availableRepos',List(o.availableRepos))
				if (o.reposLoading && !Map.isMap(o.reposLoading)) {
					o = o.set('reposLoading',List(o.reposLoading))
				}
			} else {
				if (!List.isList(o.availableRepos))
					o.availableRepos = List(o.availableRepos)
				if (o.reposLoading && !Map.isMap(o.reposLoading)) {
					o.reposLoading = Map(o.reposLoading)
				}
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
	
	toJS() {
		return {
			selectedRepoIds: this.selectedRepoIds,
			availableRepos: _.toJS(this.availableRepos)
		}
	}
	
	reposLoading:Map<number,boolean>
	selectedRepoIds:number[]
	availableRepos:List<AvailableRepo>

}

/**
 * RepoMessage
 */
export interface RepoMessage extends ActionMessage<RepoState> {

}
