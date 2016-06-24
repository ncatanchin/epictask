const log = getLogger(__filename)

import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {RepoKey} from "../../../shared/Constants"
import {RepoState,RepoMessage} from './RepoState'



export class RepoReducer extends DefaultLeafReducer<any,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	defaultState():any {
		return new RepoState()
	}
}