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

export const IssuePatchStateRecord = Record({
	issues: List<Issue>(),
	issueKeys:List<number>(),
	mode: null,
	saveError:null,
	saving:false,
	
	ready: false
	
})

/**
 * IssuePatchState
 *
 * @class IssuePatchState
 * @constructor
 **/
export class IssuePatchState extends IssuePatchStateRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,IssuePatchState,[],[]
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
	
	mode:TIssuePatchMode
	issueKeys:List<number>
	issues:List<Issue>
	saveError:any
	saving:boolean
	ready:boolean
	
}

export default IssuePatchState