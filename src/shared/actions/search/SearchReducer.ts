import {List,Record,Map} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {SearchKey} from "../../Constants"
import {SearchMessage, SearchState, SearchResult, Search, SearchType, SearchSource} from './SearchState'


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

	setQuery(state:SearchState, searchId:string, types:SearchType[], query:string) {
		return this.updateSearch(state,searchId,(search) => {
			return search.merge({query,types,id:searchId})
		})

	}

	setResults(state:SearchState,searchId:string,source:SearchSource,newResults:SearchResult) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('results',search.results.set(source,newResults))
		})
	}

	setError(state:SearchState,searchId:string,err:Error) {
		return this.updateSearch(state,searchId,(search) => {
			return search.set('error',err)
		})

	}
}