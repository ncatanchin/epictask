import { Map, Record, List } from "immutable"
import IssuePatchState from "epic-ui-components/pages/issue-patch/IssuePatchState"
import { cloneObjectShallow, parseJSON, notifyError } from "epic-global"
import { getValue } from "typeguard"
import { Issue } from "epic-models"
import { getIssueActions } from "epic-typedux/provider"
import {EventEmitter} from 'events'
import { ViewStateEvent } from "epic-typedux/state/window/ViewState"
/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * IssuePatchController
 *
 * @class IssuePatchController
 * @constructor
 **/
class IssuePatchController extends EventEmitter implements IViewController<IssuePatchState> {
	
	private state:IssuePatchState
	
	
	private init = false
	
	constructor(public id:string,initialState:IssuePatchState = new IssuePatchState()) {
		super()
		
		this.state = initialState
	}
	
	/**
	 * On mount - load issues
	 *
	 * @param mounted
	 * @param props
	 * @param cb
	 */
	setMounted(mounted:boolean,props,cb) {
		if (this.init)
			return
		
		this.init = true
		
		const
			{params} = props,
			
			{issueKeys: issueKeysStr,mode} = params,
			issueKeysJson = getValue(() => issueKeysStr,"[]"),
			issueKeys = List<string>(parseJSON(issueKeysJson)),
			
			setReady = () => this.updateState({
				mode,
				ready: true
			})
		
		if (!issueKeys || !issueKeys.size) {
			notifyError(`No issues were provided`)
			setReady()
			cb && cb()
		} else {
			this.loadIssues(issueKeys).then((issues) => {
				log.debug(`Loaded issues`, issues)
				cb && cb()
				setReady()
			})
		}
		
		
	}
	
	/**
	 * Load patching issues
	 *
	 * @param issueKeys
	 */
	async loadIssues(issueKeys:List<string>) {
		
		const
			issues = await getIssueActions().loadIssues(issueKeys)
		
		if (!issues) {
			notifyError(`No issues loaded for ${issueKeys.size}`)
			return
		}
		this.setIssues(issues)
		return issues
	
	}
	
	
	getState():IssuePatchState {
		return this.state
	}
	
	
	/**
	 * Update/patch the current state
	 *
	 * @param patch
	 * @returns {any}
	 */
	updateState(patch:{[prop:string]:any}) {
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
			}) as IssuePatchState
		
		if (updatedState !== this.state) {
			this.state = updatedState
			this.emit(ViewStateEvent[ ViewStateEvent.Changed ],updatedState)
		}
		
		return updatedState
	}
	
	
	/**
	 * Set saving
	 *
	 * @param saving
	 */
	setSaving(saving:boolean) {
		this.updateState({saving})
	}
	
	/**
	 * Save error
	 *
	 * @param saveError
	 */
	setSaveError(saveError) {
		this.updateState({saveError})
	}
	
	/**
	 * Set the editing issue
	 *
	 * @param issues
	 */
	setIssues(issues:List<Issue>) {
		this.updateState({
			issues,
			issueKeys: issues.map(issue => Issue.makeIssueId(issue))
		})
	}
	
	makeStateUpdate<T extends Function>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				updatedState = stateUpdater(this.state) as IssuePatchState
			
			if (updatedState === this.state) {
				log.debug(`No state update`, args)
				return this.state
			}
			
			this.state = updatedState
			return updatedState
			
		}) as any
	}
}

export default IssuePatchController