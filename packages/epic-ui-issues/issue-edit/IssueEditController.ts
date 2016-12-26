import IssueEditState from "./IssueEditState"
import { cloneObjectShallow, PersistentValue } from "epic-global"
import { getValue } from "typeguard"
import { Issue, Repo } from "epic-models"
import { getIssueActions, availableReposSelector } from "epic-typedux"
import { ViewEvent} from "epic-typedux/state/window"
import {StoreViewController} from "epic-ui-components/layout"
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
class IssueEditController extends StoreViewController<IssueEditState> implements IViewController<IssueEditState> {
	
	private init = false
	
	constructor(id:string, initialState:IssueEditState = new IssueEditState(), opts:any = {}) {
		super(id,initialState,opts)
		
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
				
				repo = getValue(() => availRepo.repo, null)
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
	
	async newIssue() {
		const
			{ repo } = this
		
		assert(repo,`No repos available`)
		
		log.debug(`Creating new issue using repo`, repo, `stored repo id is`, repoIdValue.get())
		
		this.setEditingIssue(new Issue({
			repo,
			repoId: repo.id
		}))
		
		await Promise.setImmediate()
	}
	
	async setMounted(mounted:boolean, props, cb) {
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
			{ params } = props,
			{ issueId } = params || {} as any,
			setReady = () => this.updateState({
				ready: true
				
			})
		
		if (!issueId || [ "-1", -1, 0, null ].includes(issueId)) {
			await this.newIssue()
			setReady()
			cb && cb()
		} else {
			await this.loadIssue(issueId)
			cb && cb()
			setReady()
		
		}
		
		
	}
	
	async loadIssue(issueId:string) {
		
		const
			issue = await getIssueActions().loadIssue(issueId)
		
		log.debug(`Loaded issue`,issue)
		if (!issue)
			return
		
		this.setEditingIssue(issue)
		
		await Promise.setImmediate()
	}
	
	
	
	//
	// /**
	//  * Update/patch the current state
	//  *
	//  * @param patch
	//  * @returns {any}
	//  */
	// updateState(patch:{ [prop:string]:any }) {
	// 	patch = cloneObjectShallow(patch)
	//
	// 	const
	// 		keys = getValue(() => Object.keys(patch))
	//
	//
	// 	if (!patch || !keys || !keys.length)
	// 		return this.state
	//
	// 	const
	// 		startState = this.state,
	// 		updatedState = startState.withMutations(state => {
	// 			for (let key of keys) {
	// 				const
	// 					newVal = patch[ key ]
	//
	// 				if (state.get(key) !== newVal)
	// 					state = state.set(key, newVal)
	// 			}
	//
	// 			return state
	// 		}) as IssueEditState
	//
	// 	if (updatedState !== startState) {
	// 		this.setState(updatedState)
	// 		this.emit(ViewStateEvent[ ViewStateEvent.Changed ], updatedState)
	// 	}
	//
	// 	return updatedState
	// }
	
	
	/**
	 * Set saving
	 *
	 * @param saving
	 */
	setSaving(saving:boolean) {
		this.updateState({ saving })
	}
	
	/**
	 * Save error
	 *
	 * @param saveError
	 */
	setSaveError(saveError) {
		this.updateState({ saveError })
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
	
}

export default IssueEditController