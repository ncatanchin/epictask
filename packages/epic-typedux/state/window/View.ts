import { Map, Record, List } from "immutable"
import { shortId } from "epic-util"
import { reviveImmutable } from "epic-util"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"
import { cloneObjectShallow } from "epic-global"


/**
 * Created by jglanz on 11/5/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


export const ViewRecord = Record({
	id: shortId(),
	parentId: null,
	index:-1,
	name: null,
	title: null,
	type: null,
	temp: true,
	tab: false,
	state: Map<any,any>()
})


export enum ViewEvent {
	Changed
}

/**
 * ViewState
 *
 * @class ViewState
 * @constructor
 **/
export class View extends ViewRecord {
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			View,
			[],
			['state']
		)
	}
	
	toJS() {
		if (this.temp)
			return null
		
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
	title:string
	type: string
	tab:boolean
	temp:boolean
	state: Map<any,any>
}

export default View