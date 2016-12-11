import { Map, Record, List } from "immutable"
import { shortId } from "epic-global/IdUtil"
import { reviveImmutable } from "epic-global/ModelUtil"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { cloneObjectShallow } from "epic-global"


/**
 * Created by jglanz on 11/5/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


export const ViewStateRecord = Record({
	id: shortId(),
	parentId: null,
	index:-1,
	name: null,
	type: null,
	state: Map<any,any>()
})


export enum ViewStateEvent {
	Changed
}

/**
 * ViewState
 *
 * @class ViewState
 * @constructor
 **/
export class ViewState extends ViewStateRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			ViewState,
			[],
			['state']
		)
	}
	
	toJS() {
		return toPlainObject(
			cloneObjectShallow(super.toJS(),{
				state: this.state.toJS ? this.state.toJS() : this.state
			}),
			excludeFilterConfig()
		)
	}
	
	constructor(o:any = {}) {
		super(o)
		
		
	}
	
	
	id:string
	parentId:string
	index:number
	name:string
	type: string
	state: Map<any,any>
}

export default ViewState