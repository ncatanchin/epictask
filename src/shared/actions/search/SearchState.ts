/**
 * State Holder
 */
import {List,Record,Map} from 'immutable'
import {Issue, isIssue, Repo, AvailableRepo} from 'shared/models'
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'




export enum SearchType {
	Issue = 1,
	Repo,
	AvailableRepo
}


export enum SearchSource {
	Issue = 1,
	Repo,
	ExactRepo,
	AvailableRepo
}

export const SearchTypeSourceMap = {
	[SearchType.Issue]: [SearchSource.Issue],
	[SearchType.Repo]: [SearchSource.Repo,SearchSource.ExactRepo],
	[SearchType.AvailableRepo]: [SearchSource.AvailableRepo],
}

export const SearchSourceTypeMap = {
	[SearchSource.Issue]:SearchType.Issue,
	[SearchSource.Repo]:SearchType.Repo,
	[SearchSource.ExactRepo]:SearchType.Repo,
	[SearchSource.AvailableRepo]:SearchType.AvailableRepo

}

@RegisterModel
export class SearchItem {

	static fromJS = (o:any) => new SearchResult(o)

	id:string|number
	type:SearchType

	constructor(id:string|number, type:SearchType)
	constructor(obj:any)
	constructor(idOrObject:any, type:SearchType = null) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			Object.assign(this, {
				id: idOrObject,
				type
			})
		} else {
			Object.assign(this, idOrObject)
		}

	}
}

/**
 * Search Result
 */
@RegisterModel
export class SearchResult {

	static fromJS = (o:any) => new SearchResult(o)

	items:List<SearchItem>
	type:SearchType
	source:SearchSource

	constructor(items:List<SearchItem>, type:SearchType, source:SearchSource,count:number,total:number)
	constructor(obj:any)
	constructor(
		itemsOrObject:any,
		type:SearchType = null,
		source:SearchSource = null,
		public count:number = -1,
		public total:number = -1
	) {
		if (List.isList(itemsOrObject)) {
			Object.assign(this,{
				items:itemsOrObject,
				type,
				source
			})
		} else {
			Object.assign(this,itemsOrObject)
		}
	}

}

/**
 * immutable record for search
 *
 * @type {Record.Class}
 */
export const SearchRecord = Record({
	id:null,
	results:Map<SearchSource,SearchResult>(),
	error: null,
	query: null,
	searching: false,
	types: []
})

/**
 * Represents a specific search panel
 */
@RegisterModel
export class Search extends SearchRecord {
	static fromJS(o:any) {
		return new Search(Object.assign({},o,{
			results: List(o.results)
		}))
	}

	id:string

	results:Map<SearchSource,SearchResult>

	types: SearchType[]

	error:Error

	query:string

	searching:boolean
}

/**
 * Search state record
 *
 * @type {Record.Class}
 */
export const SearchStateRecord = Record({
	searches:Map<string,Search>()
})

/**
 * Search State class with some helpers
 */
@RegisterModel
export class SearchState extends SearchStateRecord {

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
