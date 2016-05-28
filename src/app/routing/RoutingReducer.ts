import {ILeafReducer} from 'typedux'
import {RoutingKey} from '../../shared/Constants'
import {LOCATION_CHANGE} from 'react-router-redux'
import {RoutingMessage} from './RoutingMessage'
import {RoutingStateType} from './RoutingState'

export class RoutingReducer implements ILeafReducer<RoutingStateType,RoutingMessage> {

	constructor() {}


	leaf():string {
		return RoutingKey;
	}


	defaultState():RoutingStateType {
		return Immutable.Map<string,any>({});
	}

	/**
	 * Handle an incoming action
	 * @param state
	 * @param action
	 */
	handle(state:RoutingStateType,action:RoutingMessage):RoutingStateType {
		if (action.type === LOCATION_CHANGE) {
			return state.merge({locationBeforeTransitions: action.payload})
		}


		return state


	}
}

