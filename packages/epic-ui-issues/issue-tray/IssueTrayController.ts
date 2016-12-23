import { Map, Record, List } from "immutable"
import { IssueTrayState } from "epic-ui-issues/issue-tray/IssueTrayState"
import {EventEmitter} from 'events'
import { cloneObjectShallow, RepoKey } from "epic-global"
import { getValue } from "typeguard"
import { ViewEvent } from "epic-typedux/state/window"
import { getIssueActions } from "epic-typedux/provider"
import { DefaultIssueCriteria } from "epic-models"
import { StoreViewController } from "epic-ui-components/layout"

/**
 * Created by jglanz on 12/20/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

/**
 * IssueTrayController
 *
 * @class IssueTrayController
 * @constructor
 **/
export class IssueTrayController extends StoreViewController<IssueTrayState> implements IViewController<IssueTrayState> {
	
	constructor(id:string,initialState = new IssueTrayState(),opts:any = {}) {
		super(id,initialState,opts)
		
		getStore().observe([RepoKey,'availableRepos'],this.onReposChanged)
	}
	
	
	
	/**
	 * Observe handler for repo state changes
	 *
	 * @param newAvailableRepos
	 */
	private onReposChanged = (newAvailableRepos) => {
		const
			repoIds = newAvailableRepos.map(it => it.id)
		
		log.debug(`new avail repos`,newAvailableRepos,repoIds)
		
		this.updateState({repoIds})
		
		this.loadIssues()
		
	}
	
	/**
	 * When tray mounted
	 */
	onMounted = () => {
		this.loadIssues()
	}
	
	
	/**
	 * Load issues
	 */
	loadIssues = _.debounce(async () => {
		if (!this.state.repoIds.size)
			return log.debug(`Repos not ready yet`)
		
		const
			issues = (await
				getIssueActions().queryIssues({ ...DefaultIssueCriteria, includeFocused: true }, this.state.repoIds)
			).filter(issue => issue.focused === true)
		
		log.debug(`Loaded issues`, issues)
		this.updateState({ issues })
	},150)
	
	
	
	
	
}

export default IssueTrayController