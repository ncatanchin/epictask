const log = getLogger(__filename)

import {DefaultLeafReducer} from 'typedux'
import {IssueKey} from "Constants"
import {IssueState,IssueMessage} from './IssueState'



export class IssueReducer extends DefaultLeafReducer<IssueState,IssueMessage> {

	constructor() {
		super(IssueKey,IssueState)
	}


	/**
	 *
	 * @returns {RepoState}
	 */
	defaultState():any {
		return new IssueState()
	}


}