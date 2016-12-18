import { Map, Record, List } from "immutable"
import IssueEditState from "./IssueEditState"
import { cloneObjectShallow } from "epic-global"
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
 * IssueEditController
 *
 * @class IssueEditController
 * @constructor
 **/
class IssueEditController extends EventEmitter implements IViewController<IssueEditState> {
	
	private state:IssueEditState
	
	
	private init = false
	
	constructor(public id:string,initialState:IssueEditState = new IssueEditState()) {
		super()
		
		this.state = initialState
	}
	
	setMounted(mounted:boolean,props,cb) {
		if (this.init)
			return
		
		this.init = true
		
		const
			{params} = props,
			{issueId} = params || {} as any,
			setReady = () => this.updateState({
				ready: true
			})
		
		if (!issueId || ["-1",-1,0,null].includes(issueId)) {
			setReady()
			cb && cb()
		} else {
			this.loadIssue(issueId).then(() => {
				cb && cb()
				setReady()
			})
		}
		
		
	}
	
	async loadIssue(issueId:string) {
		
		const
			issue = await getIssueActions().loadIssue(issueId)
		
		if (!issue)
			return
		
		this.setEditingIssue(issue)
	
	}
	
	
	getState():IssueEditState {
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
			}) as IssueEditState
		
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
	 * @param editingIssue
	 */
	setEditingIssue(editingIssue:Issue) {
		this.updateState({
			editingIssue: cloneObjectShallow(editingIssue)
		})
	}
	
	makeStateUpdate<T extends Function>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				updatedState = stateUpdater(this.state) as IssueEditState
			
			if (updatedState === this.state) {
				log.debug(`No state update`, args)
				return this.state
			}
			
			this.state = updatedState
			return updatedState
			
		}) as any
	}
}

export default IssueEditController