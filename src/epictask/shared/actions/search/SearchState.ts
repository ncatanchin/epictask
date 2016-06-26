/**
 * State Holder
 */
import {List,Record,Map} from 'immutable'
import {Issue, isIssue, Repo, AvailableRepo} from 'shared/models'
import {ActionMessage} from 'typedux'
import {SearchKey} from 'shared/Constants'
import {registerModel} from 'shared/models/Registry'

export enum SearchResultType {
	Issue = 1,
	Repo,
	AvailableRepo
}

export class SearchResult<T extends Issue|Repo|AvailableRepo> {

	$$clazz = 'SearchResult'

	index:number = -1
	type:SearchResultType

	constructor(public value:T) {

		const vAny:any = value
		if (vAny.type && vAny.value)
			Object.assign(this,vAny)
		else
			//const repoState = getStore().getState().get(RepoKey)

			this.type = isIssue(value) ? SearchResultType.Issue :
				(value instanceof Repo) ? SearchResultType.Repo :
					SearchResultType.AvailableRepo
	}

}

registerModel('SearchResult',SearchResult)


export const SearchStateRecord = Record({
	results:List<any>(),
	error: null,
	query: null,
	searching: false,

})

export class SearchState extends SearchStateRecord {

	static fromJS(o:any) {
		return new SearchState(Object.assign({},o,{
			results: List(o.results)
		}))
	}

	results:List<any>

	error:Error

	query:string

	searching:boolean



}


/**
 * The action message for search
 */
export interface SearchMessage extends ActionMessage<SearchState> {

}

registerModel(SearchKey,SearchState)