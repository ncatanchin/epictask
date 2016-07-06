import {List,Record,Map} from 'immutable'
import {DefaultLeafReducer} from 'typedux'
import {SearchKey} from "../../Constants"
import {SearchMessage, SearchState, SearchResult} from './SearchState'


export class SearchReducer extends DefaultLeafReducer<any,SearchMessage> {

	constructor() {
		super(SearchKey,SearchState)
	}


	defaultState():any {
		return new SearchState()
	}

	setSearching(state:SearchState,searching:boolean) {
		return state.merge({searching})
	}

	setQuery(state:SearchState,query:string) {
		return state.merge({query})
	}

	setResults(state:SearchState,newResults:List<SearchResult<any>>) {

		return state.set('results',newResults)
	}

	setError(state:SearchState,err:Error) {
		return state.merge({error:err})
	}
}