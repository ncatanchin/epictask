import { Map, Record, List } from "immutable"
import { shortId } from "epic-global/IdUtil"
import { reviveImmutable } from "epic-global/ModelUtil"


/**
 * Created by jglanz on 11/5/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


export const ViewStateRecord = Record({
	id: shortId(),
	name: null,
	stateClazz: null,
	controller: null,
	controllerClazz: null,
	componentLoader: null,
	state: Map<any,any>()
})


/**
 * ViewState
 *
 * @class ViewState
 * @constructor
 **/
class ViewState extends ViewStateRecord implements IViewConfig{
	
	
	static fromJS(o:any = {}) {
		return reviveImmutable(
			o,
			ViewState,
			[],
			['state']
		)
	}
	
	
	constructor(o:any = {}) {
		super(o)
		
		
	}
	
	
	id:string
	name:string
	componentLoader: TPromisedComponentLoader
	controllerClazz: any
	controller: any
	state: Map<any,any>
	stateClazz:{new():Map<any,any>}
}

export default ViewState