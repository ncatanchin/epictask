
const
	log = getLogger(__filename)

import {DefaultLeafReducer} from 'typedux'
import {RepoKey} from "epic-global"
import {RepoState,RepoMessage} from '../state/RepoState'

import {Provided} from  "epic-common"

@Provided
export class RepoReducer extends DefaultLeafReducer<RepoState,RepoMessage> {

	constructor() {
		super(RepoKey,RepoState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState(o = {}):any {
		return RepoState.fromJS(o)
	}

}