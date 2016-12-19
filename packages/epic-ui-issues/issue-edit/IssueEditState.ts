import { Map, Record, List } from "immutable"
import { reviveImmutable } from "epic-global"
import { Issue } from "epic-models"

/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

export const IssueEditStateRecord = Record({
	editingIssue: null,
	
	saveError:null,
	saving:false,
	
	ready: false
	
})

/**
 * IssueEditState
 *
 * @class IssueEditState
 * @constructor
 **/
export class IssueEditState extends IssueEditStateRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,IssueEditState,[],[]
		)
	}
	
	constructor(o:any = {}) {
		super(o)
	}
	
	/**
	 * toJS()
	 *
	 * @returns {any}
	 */
	toJS() {
		return super.toJS()
	}
	
	
	editingIssue:Issue
	saveError:any
	saving:boolean
	ready:boolean
	
}

export default IssueEditState