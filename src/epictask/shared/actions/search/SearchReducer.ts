import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {SearchKey} from "../../../shared/Constants"
import {SearchState} from './SearchState'


export interface SearchMessage extends ActionMessage<typeof SearchState> {
	
}


export class SearchReducer extends DefaultLeafReducer<any,SearchMessage> {

	constructor() {
		super(SearchKey,SearchState)
	}


	defaultState():any {
		return new SearchState()
	}
}