import {List,Record,Map} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {SearchKey} from "../../Constants"
import {SearchMessage, SearchState, SearchResult, Search} from './SearchState'


export class SearchReducer extends DefaultLeafReducer<any,SearchMessage> {

	constructor() {
		super(SearchKey,SearchState)
	}

	defaultState():any {
		return new SearchState()
	}

	private updateSearch(state:SearchState,searchId:string,updater:(search:Search) => any) {
		return state.updateIn(['searches',searchId], new Search(), (search:Search) => {
			return updater(search)
		})
	}

	setSearching(state:SearchState,searchId:string,searching:boolean) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('searching',searching)
		})
	}

	setQuery(state:SearchState,searchId:string,query:string) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('query',query)
		})

	}

	setResults(state:SearchState,searchId:string,newResults:List<SearchResult<any>>) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('results',newResults)
		})
	}

	setError(state:SearchState,searchId:string,err:Error) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('error',err)
		})

	}
}