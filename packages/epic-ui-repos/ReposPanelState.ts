import { Map, Record, List } from "immutable"

/**
 * Created by jglanz on 12/24/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

export const ReposPanelStateRecord = Record({
	selectedRepoId:null
})

/**
 * ReposPanelState
 *
 * @class ReposPanelState
 * @constructor
 **/
class ReposPanelState extends ReposPanelStateRecord {
	
	static fromJS(o:any = {}) {
		return new ReposPanelState(o)
	}
	
	constructor(o:any = {}) {
		super(o)
	}
	
	selectedRepoId:number
	
}

export default ReposPanelState