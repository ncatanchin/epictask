

import {ActionMessage} from 'typedux'
import * as Immutable from 'immutable'
import {RoutingStateType} from './RoutingState'


export interface RoutingMessage extends ActionMessage<RoutingStateType> {
	payload?:any
}