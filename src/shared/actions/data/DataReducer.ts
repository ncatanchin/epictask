import {DefaultLeafReducer} from 'typedux'
import {DataMessage, DataState, DataRequest} from 'shared/actions/data/DataState'
import {DataKey} from 'shared/Constants'
import {Provided} from 'shared/util/ProxyProvided'

@Provided
export class DataReducer extends DefaultLeafReducer<DataState,DataMessage> {

	constructor() {
		super(DataKey, DataState)
	}


	defaultState(o = {}):any {
		return DataState.fromJS(o)
	}









}