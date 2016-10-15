/**
 * State Holder
 */
import {List} from 'immutable'
import {RegisterModel} from 'shared/Registry'
import SearchProvider from "shared/actions/search/SearchProvider"





export enum SearchType {
	Issue = 1,
	Assignee,
	Repo,
	AvailableRepo,
	Milestone,
	Label,
	Action
}


export enum SearchSource {
	Issue = 1,
	Assignee,
	Repo,
	GitHub,
	AvailableRepo,
	Milestone,
	Label,
	Action
}

export const SearchTypeSourceMap = {
	[SearchType.Assignee]: [SearchSource.Assignee],
	[SearchType.Issue]: [SearchSource.Issue],
	[SearchType.Repo]: [SearchSource.Repo,SearchSource.GitHub],
	[SearchType.AvailableRepo]: [SearchSource.AvailableRepo],
	[SearchType.Label]: [SearchSource.Label],
	[SearchType.Milestone]: [SearchSource.Milestone],
	[SearchType.Action]: [SearchSource.Action]
}

export const SearchSourceTypeMap = {
	[SearchSource.Assignee]:SearchType.Assignee,
	[SearchSource.Issue]:SearchType.Issue,
	[SearchSource.Repo]:SearchType.Repo,
	[SearchSource.GitHub]:SearchType.Repo,
	[SearchSource.AvailableRepo]:SearchType.AvailableRepo,
	[SearchSource.Milestone]:SearchType.Milestone,
	[SearchSource.Label]:SearchType.Label,
	[SearchSource.Action]:SearchType.Action

}

@RegisterModel
export class SearchItem {

	static fromJS(o:any) {
		return new SearchItem(o)
	}

	id:string|number
	type:SearchType
	score:number
	value:any
	
	
	constructor(id:string|number,type:SearchType,value,score:number)
	constructor(obj:any)
	constructor(idOrObject:any, type:SearchType = null,value = null,score:number = 1) {
		if (_.isNumber(idOrObject) || _.isString(idOrObject)) {
			Object.assign(this, {
				id: idOrObject,
				type,
				score,
				value
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

	static fromJS(o:any) {
		if (o && o instanceof SearchResult)
			return o
		
		return new SearchResult(o)
	}

	items:List<SearchItem>
	type:SearchType
	source:SearchSource
	dataId:string
	searchId:string

	constructor(searchId:string,items:List<SearchItem>,type:SearchType, source:SearchSource,count:number,total:number)
	constructor(obj:any)
	constructor(
		searchIdOrObject:any,
		items:List<SearchItem> = List<SearchItem>(),
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

export interface ISearchState {
	items:List<SearchItem>
	results:SearchResult[]
	working?:boolean
	selectedIndex:number
	provider:SearchProvider
}