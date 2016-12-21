import { Map, Record, List } from "immutable"
import { IssueTrayState } from "epic-ui-issues/issue-tray/IssueTrayState"
import {EventEmitter} from 'events'
import { cloneObjectShallow, RepoKey } from "epic-global"
import { getValue } from "typeguard"
import { ViewStateEvent } from "epic-typedux/state/window"
import { getIssueActions } from "epic-typedux/provider"
import { DefaultIssueCriteria } from "epic-models"

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
export class IssueTrayController extends EventEmitter implements IViewController<IssueTrayState> {
	
	private state:IssueTrayState
	
	constructor(public id:string,initialState = new IssueTrayState()) {
		super()
		
		this.state = initialState
		
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
	
	/**
	 * Get the view state
	 *
	 * @returns {IssueTrayState}
	 */
	getState():IssueTrayState {
		return this.state
	}
	
	/**
	 * Patch the view state
	 *
	 * @param patch
	 * @returns {IssueTrayState}
	 */
	updateState(patch:{ [p:string]:any }):IssueTrayState {
		patch = cloneObjectShallow(patch)
		
		const
			keys = getValue(() => Object.keys(patch))
		
		
		if (!patch || !keys || !keys.length)
			return this.state
		
		const
			updatedState = this.state.withMutations(state => {
				for (let key of keys) {
					const
						newVal = patch[ key ]
					
					if (state.get(key) !== newVal)
						state = state.set(key, newVal)
				}
				
				return state
			}) as IssueTrayState
		
		if (updatedState !== this.state) {
			this.state = updatedState
			this.emit(ViewStateEvent[ ViewStateEvent.Changed ],updatedState)
		}
		
		return updatedState
	}
	
	/**
	 * Make state updater
	 *
	 * @param updater
	 */
	makeStateUpdate<T extends Function>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				updatedState = stateUpdater(this.state) as IssueTrayState
			
			if (updatedState === this.state) {
				log.debug(`No state update`, args)
				return this.state
			}
			
			this.state = updatedState
			return updatedState
			
		}) as any
	}
	
	
	
}

export default IssueTrayController