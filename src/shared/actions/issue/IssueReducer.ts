const log = getLogger(__filename)

import {DefaultLeafReducer} from 'typedux'
import {IssueKey} from "Constants"
import {IssueState,IssueMessage} from './IssueState'
import {Provided} from 'shared/util/Decorations'

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