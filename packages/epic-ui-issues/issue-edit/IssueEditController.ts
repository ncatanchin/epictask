import { Map, Record, List } from "immutable"
import IssueEditState from "./IssueEditState"
import { cloneObjectShallow, PersistentValue } from "epic-global"
import { getValue } from "typeguard"
import { Issue, Repo } from "epic-models"
import { getIssueActions } from "epic-typedux/provider"
import {EventEmitter} from 'events'
import { ViewStateEvent } from "epic-typedux/state/window/ViewState"
import { availableReposSelector } from "epic-typedux/selectors"
/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

const
	repoIdValue = new PersistentValue<number>('createIssueRepoId')


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
	
	/**
	 * Get the current editing issue repo
	 *
	 * @returns {Repo}
	 */
	private get repo():Repo {
		const
			availableRepos = availableReposSelector(getStoreState()),
			issue = getValue(() => this.state.editingIssue)
		
		if (!availableRepos.size)
			return getValue(() => issue.repo)
		
		let
			repo:Repo
		
		
		if (issue) {
			if (issue.repo) {
				return issue.repo
			} else if (issue.repoId) {
				const
					availRepo = availableRepos.find(it => `${it.id}` === `${issue.repoId}`)
				
				repo = getValue(() => availRepo.repo,null)
			}
		}
		
		if (!repo) {
			const
				repoId = repoIdValue.get()
			
			if (repoId) {
				repo = getValue(() => availableRepos.find(it => `${it.repo.id}` === `${repoId}`).repo)
			}
			
			if (!repo)
				repo = getValue(() => availableRepos.get(0).repo)
		}
		
		return repo
	}
	
	newIssue() {
		const
			{repo} = this
		
		if (!repo)
			return null
		
		log.debug(`Creating new issue using repo`,repo,`stored repo id is`,repoIdValue.get())
		
		this.setEditingIssue(new Issue({
				repo,
				repoId: repo.id
		}))
		
		
		
		
	}
	
	setMounted(mounted:boolean,props,cb) {
		// ALWAYS NULL ISSUE ON MOUNT
		if (mounted) {
			this.updateState({
				editingIssue: null
			})
		}
		
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
			this.newIssue()
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