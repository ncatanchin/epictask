import { Map, Record, List } from "immutable"
import { toPlainObject, excludeFilterConfig, excludeFilter } from "typetransform"

/**
 * Created by jglanz on 1/22/17.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


export const PluginStateRecord = Record({
	config:null,
	timestamp: 0,
	processStatus:Map<string,PluginStatus>()
})

/**
 * PluginState
 *
 * @class PluginState
 * @constructor
 **/
export class PluginState extends PluginStateRecord implements IPluginState {
	
	constructor(o:any = {}) {
		super(o)
	}
	
	toJS() {
		return toPlainObject(this,excludeFilterConfig(
			...excludeFilter('processStatus')
		))
	}
	
	timestamp: number
	config:IPluginConfig
	processStatus:Map<string, PluginStatus>
}

