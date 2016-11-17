import { EventEmitter } from "events"
import { getValue } from "typeguard"
import {Comment} from 'epic-models'
import { cloneObjectShallow, addErrorMessage } from "epic-global"
import { getIssueActions } from "epic-typedux/provider"
import { ViewStateEvent } from "epic-typedux/state/window/ViewState"
import CommentEditState from "epic-ui-components/pages/comment-edit/CommentEditState"
import { getStores } from "epic-database-client"
/**
 * Created by jglanz on 11/12/16.
 */

const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * CommentEditController
 *
 * @class CommentEditController
 * @constructor
 **/
class CommentEditController extends EventEmitter implements IViewController<CommentEditState> {
	
	private state:CommentEditState
	
	
	private init = false
	
	constructor(public id:string,initialState:CommentEditState = new CommentEditState()) {
		super()
		
		this.state = initialState
	}
	
	setMounted(mounted:boolean,props,cb = null) {
		if (this.init)
			return
		
		this.init = true
		
		const
			{params} = props,
			{issueId,commentId} = params || {} as any,
			setReady = () => this.updateState({
				ready: true
			})
		
		if (!issueId) {
			setReady()
			cb && cb()
		} else {
			this.loadComment(issueId,commentId)
				.then(() => {
					cb && cb()
					setReady()
				})
		}
		
		
	}
	
	/**
	 * Load comment
	 *
	 * @param issueId
	 * @param commentId
	 */
	async loadComment(issueId:string,commentId:string) {
		
		let
			issue = await getIssueActions().loadIssue(issueId),
			comment = await getStores().comment.get(commentId)
		
		if (!comment)
			comment = new Comment()
		
		if (!issue)
			return
		
		this.updateState({
			issue,
			editingComment: comment
		})
	
	}
	
	
	getState():CommentEditState {
		return this.state
	}
	
	/**
	 * Save the comment
	 */
	async save() {
		const
			{issue,editingComment:comment} = this.state
		
		try {
			this.setSaving(true)
			
			await Promise.setImmediate()
			await getIssueActions().saveComment(issue,comment)
			
			// this.setSaving(false)
			getCurrentWindow().close()
		} catch (err) {
			log.error(`Failed to save comment`,issue,comment,err)
			addErrorMessage(`Failed to save comment`)
			
			this.updateState({
				saving: false,
				saveError: err
			})
			
		}
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
			}) as CommentEditState
		
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
	 * @param editingComment
	 */
	setEditingComment(editingComment:Comment) {
		this.updateState({
			editingComment: cloneObjectShallow(editingComment)
		})
	}
	
	makeStateUpdate<T extends Function>(updater:T):T {
		return ((...args) => {
			
			const
				stateUpdater = updater(...args),
				updatedState = stateUpdater(this.state) as CommentEditState
			
			if (updatedState === this.state) {
				log.debug(`No state update`, args)
				return this.state
			}
			
			this.state = updatedState
			return updatedState
			
		}) as any
	}
}

export default CommentEditController