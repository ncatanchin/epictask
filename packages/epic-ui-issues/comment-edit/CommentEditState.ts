import { Map, Record, List } from "immutable"
import { reviveImmutable } from "epic-global"
import { Issue,Comment } from "epic-models"

/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

export const CommentEditStateRecord = Record({
	editingComment: new Comment(),
	issue: null,
	saveError:null,
	saving:false,
	ready: false
	
})

/**
 * CommentEditState
 *
 * @class CommentEditState
 * @constructor
 **/
export class CommentEditState extends CommentEditStateRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			CommentEditState,
			[],
			[]
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
	
	
	editingComment:Comment
	issue:Issue
	saveError:any
	saving:boolean
	ready:boolean
	
}

export default CommentEditState