import { EventEmitter } from "events"
import { getValue } from "typeguard"
import {Comment} from 'epic-models'
import { cloneObjectShallow, notifyError, notifySuccess } from "epic-global"
import { getIssueActions, getUIActions } from "epic-typedux/provider"
import { ViewEvent } from "epic-typedux/state/window/View"
import CommentEditState from "./CommentEditState"
import { getStores } from "epic-database-client"
import { StoreViewController } from "epic-ui-components"
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
class CommentEditController extends StoreViewController<CommentEditState> {
	
	private init = false
	
	constructor(id:string,initialState:CommentEditState = new CommentEditState(),opts:any = {}) {
		super(id,initialState,opts)
		
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
			notifySuccess(`Saved Comment for: ${issue.repo.full_name} #${issue.number}`)
			getUIActions().closeWindow()
		} catch (err) {
			log.error(`Failed to save comment`,issue,comment,err)
			
			notifyError(`Failed to save comment`)
			
			this.updateState({
				saving: false,
				saveError: err
			})
			
		}
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
	
}

export default CommentEditController