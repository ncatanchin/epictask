import { Map, Record, List } from "immutable"
import { StoreViewController } from "epic-ui-components/layout/view"

import ReposPanelState from "epic-ui-repos/ReposPanelState"

/**
 * Created by jglanz on 12/24/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * ReposPanelController
 *
 * @class ReposPanelController
 * @constructor
 **/
class ReposPanelController extends StoreViewController<ReposPanelState> {
	
	constructor(id:string,initialState = new ReposPanelState(),opts:any) {
		super(id,initialState,opts)
	}
	
}

export default ReposPanelController