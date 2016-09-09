import {DefaultLeafReducer} from 'typedux'
import {SearchKey} from "shared/Constants"
import {SearchMessage, SearchState, SearchResult, Search, SearchType, SearchSource} from './SearchState'
import {Provided} from 'shared/util/ProxyProvided'

@Provided
export class SearchReducer extends DefaultLeafReducer<SearchState,SearchMessage> {

	constructor() {
		super(SearchKey,SearchState)
	}

	defaultState(o = {}):any {
		return SearchState.fromJS(o)
	}


}