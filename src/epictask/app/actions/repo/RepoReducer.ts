const log = getLogger(__filename)

import {ActionMessage,DefaultLeafReducer} from 'typedux'
import {RepoKey} from "../../../shared/Constants"
import {RepoState} from './RepoState'


export interface RepoMessage extends ActionMessage<typeof RepoState> {

}


export class RepoReducer extends DefaultLeafReducer<any,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	defaultState():any {
		return new RepoState()
	}
}