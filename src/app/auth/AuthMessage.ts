

import {ActionMessage} from 'typedux'
import {AuthStateType,AuthState} from './AuthState'

export interface AuthMessage extends ActionMessage<typeof AuthState> {

}