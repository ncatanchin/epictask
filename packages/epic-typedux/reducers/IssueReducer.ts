const log = getLogger(__filename)

import {DefaultLeafReducer} from 'typedux'
import {IssueKey} from "epic-global"
import {IssueState,IssueMessage} from '../state/IssueState'
import {Provided} from  "epic-global"

@Provided
export class IssueReducer extends DefaultLeafReducer<IssueState,IssueMessage> {

	constructor() {
		super(IssueKey,IssueState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState(o = {}):any {
		return IssueState.fromJS(o)
	}


}