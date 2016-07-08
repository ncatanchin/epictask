/**
 * State Holder
 */
import {List,Record,Map} from 'immutable'
import {Issue, isIssue, Repo, AvailableRepo} from 'shared/models'
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'


export type TSearchResult = SearchResult<Repo|AvailableRepo|Issue>

export enum SearchResultType {
	Issue = 1,
	Repo,
	AvailableRepo
}

@RegisterModel
export class SearchResult<T extends Issue|Repo|AvailableRepo> {

	static fromJS = (o:any) => new SearchResult(o)

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


export const SearchRecord = Record({
	results:List<SearchResult<any>>(),
	error: null,
	query: null,
	searching: false,
	types: []
})

@RegisterModel
export class Search extends SearchRecord {
	static fromJS(o:any) {
		return new Search(Object.assign({},o,{
			results: List(o.results)
		}))
	}

	$$clazz = 'Search'

	results:List<SearchResult<any>>

	types: SearchResultType[]

	error:Error

	query:string

	searching:boolean
}

export const SearchStateRecord = Record({
	searches:Map<string,Search>()
})

@RegisterModel
export class SearchState extends SearchStateRecord {

	$$clazz = 'SearchState'

	static fromJS(o:any) {

		const searches = _.toJS(o.searches),
			searchIds = Object.keys(searches)


		return new SearchState(Object.assign({},o,{
			searches: Map(searchIds.reduce((newSearches,searchId) => {
				newSearches[searchId] = Search.fromJS(searches[searchId])
				return newSearches
			},{}))
		}))
	}

	searches:Map<string,Search>

}


/**
 * The action message for search
 */
export interface SearchMessage extends ActionMessage<SearchState> {

}
