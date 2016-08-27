/**
 * State Holder
 */
import {List,Record,Map} from 'immutable'
import {Issue, isIssue, Repo, AvailableRepo} from 'shared/models'
import {ActionMessage} from 'typedux'
import {RegisterModel} from 'shared/Registry'
import {DataResultsContainer} from 'shared/actions/data/DataState'




export enum SearchType {
	Issue = 1,
	Repo,
	AvailableRepo,
	Milestone,
	Label
}


export enum SearchSource {
	Issue = 1,
	Repo,
	GitHub,
	AvailableRepo,
	Milestone,
	Label
}

export const SearchTypeSourceMap = {
	[SearchType.Issue]: [SearchSource.Issue],
	[SearchType.Repo]: [SearchSource.Repo,SearchSource.GitHub],
	[SearchType.AvailableRepo]: [SearchSource.AvailableRepo],
	[SearchType.Label]: [SearchSource.Label],
	[SearchType.Milestone]: [SearchSource.Milestone]
}

export const SearchSourceTypeMap = {
	[SearchSource.Issue]:SearchType.Issue,
	[SearchSource.Repo]:SearchType.Repo,
	[SearchSource.GitHub]:SearchType.Repo,
	[SearchSource.AvailableRepo]:SearchType.AvailableRepo,
	[SearchSource.Milestone]:SearchType.Milestone,
	[SearchSource.Label]:SearchType.Label

}

@RegisterModel
export class SearchItem {

	static fromJS(o:any) {
		return new SearchItem(o)
	}

	id:string|number
	type:SearchType
	score:number

	constructor(id:string|number, type:SearchType,score:number)
	constructor(obj:any)
	constructor(idOrObject:any, type:SearchType = null,score:number = 1) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			Object.assign(this, {
				id: idOrObject,
				type,
				score
			})
		} else {
			Object.assign(this, idOrObject)
		}

	}
}

export interface ISearchItemModel {
	item: SearchItem,
	model: any
}

/**
 * Search Result
 */
@RegisterModel
export class SearchResult {

	static fromJS(o:any) {
		if (o && o instanceof SearchResult)
			return o
		
		return new SearchResult(o)
	}

	items:SearchItem[]
	type:SearchType
	source:SearchSource
	dataId:string
	searchId:string

	constructor(searchId:string,items:SearchItem[],type:SearchType, source:SearchSource,count:number,total:number)
	constructor(obj:any)
	constructor(
		searchIdOrObject:any,
		items:SearchItem[] = [],
		type:SearchType = null,
		source:SearchSource = null,
		public count:number = -1,
		public total:number = -1
	) {
		if (_.isString(searchIdOrObject)) {
			Object.assign(this,{
				searchId: searchIdOrObject,
				items,
				type,
				source
			})
		} else {
			const obj = searchIdOrObject,
				baseItems = (obj.items && Array.isArray(obj.items) || List.isList(obj.items)) ?
					_.toJS(obj.items) :
					[]

			const newItems = baseItems.map(item => SearchItem.fromJS(item))

			Object.assign(this,obj,{items:newItems})
		}

		this.dataId = this.dataId || `${this.searchId}-${this.source}`
	}

}



export interface SearchResultData {
	result:SearchResult
	data:DataResultsContainer
}

export interface SearchData {
	search:Search
	results:SearchResultData[]
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
	static fromJS(o:any = {}) {
		if (o && o instanceof Search)
			return o
		
		
		const resultsObj = _.toJS(o.results),
			results = Object
				.keys(resultsObj || {})
				.reduce((resultsMap,nextKey) => {
					return resultsMap.set(parseInt(nextKey,10),resultsObj[nextKey])
				},Map<SearchSource,SearchResult>())

		return new Search(Object.assign({},o,{
			results
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
		if (o && o instanceof SearchState)
			return o
		
		const searchesObj = _.toJS(o.searches),
			searchIds = Object.keys(searchesObj || {})


		const searches = searchIds.reduce((newSearches,searchId) => {
			return newSearches.set(searchId, Search.fromJS(searchesObj[searchId]))
		},Map<string,Search>())


		return new SearchState(Object.assign({},o,{
			searches
		}))
	}

	searches:Map<string,Search>

}


/**
 * The action message for search
 */
export interface SearchMessage extends ActionMessage<SearchState> {

}
