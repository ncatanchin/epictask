import {DefaultLeafReducer} from 'typedux'
import {SearchKey} from "../../../shared/Constants"
import {SearchMessage,SearchState} from './SearchState'


export class SearchReducer extends DefaultLeafReducer<any,SearchMessage> {

	constructor() {
		super(SearchKey,SearchState)
	}


	defaultState():any {
		return new SearchState()
	}
}