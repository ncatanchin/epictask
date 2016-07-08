const log = getLogger(__filename)

import {RepoKey} from 'shared/Constants'
import {RegisterModel} from 'shared/Registry'
import {Set,List,Record} from 'immutable'
import {ActionMessage} from 'typedux'
import {Repo, AvailableRepo,Comment,Issue} from 'shared/models'

export const RepoStateRecord = Record({
	selectedRepos: List<AvailableRepo>(),
	availableRepos: List<AvailableRepo>(),
	issues:List<Issue>(),
	issue:null,
	comments:List<Comment>(),
	selectedIssues:List<Issue>(),
	selectedIssue:null,
	editingIssue: null,
	repos:List<Repo>(),
	error:null
})

@RegisterModel
export class RepoState extends RepoStateRecord {

	static fromJS(o:any) {
		return new RepoState(Object.assign({},o,{
			repos: List(o.stores),
			selectedRepos: List(o.selectedRepos),
			availableRepos: List(o.availableRepos),
			comments: List(o.comments),
			issues: List(o.issues),
			selectedIssues: List(o.selectedIssues)
		}))
	}
	$$clazz = 'RepoState'

	availableRepos: Map<string,AvailableRepo>


	issues:List<Issue>
	issue:Issue
	comments:List<Comment>
	selectedIssues:Set<Issue>
	selectedIssue:Issue
	repos:List<Repo>
	error:Error


}


//export const RepoState = makeRecord(RepoStateModel,RepoStateDefaults)
export type TRepoState = typeof RepoState
export interface RepoMessage extends ActionMessage<RepoState> {

}
