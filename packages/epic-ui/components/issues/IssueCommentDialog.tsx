/**
 * Created by jglanz on 7/24/16.
 */

// Imports
import * as React from 'react'
import { connect } from 'react-redux'
import { createDeepEqualSelector } from 'shared/util/SelectorUtil'
import { createStructuredSelector } from 'reselect'

import { ThemedStyles } from 'shared/themes/ThemeManager'
import { Comment } from 'shared/models/Comment'
import { Issue } from 'shared/models/Issue'

import {
	issueStateSelector,
	editCommentRequestSelector
} from 'shared/actions/issue/IssueSelectors'

import { uiStateSelector } from 'shared/actions/ui/UISelectors'
import { Dialogs } from 'shared/config/WindowConfig'

import { getValue } from 'shared/util'
import { TEditCommentRequest } from "shared/actions/issue/IssueState"

import { DialogRoot, createSaveCancelActions } from "ui/components/common/DialogRoot"
import { getUIActions, getIssueActions } from "shared/actions/ActionFactoryProvider"
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { MarkdownEditor } from "ui/components/common/MarkdownEditor"
import { CommandRoot, CommandContainerBuilder, CommandComponent,CommandType } from "shared/commands"
import { FileDrop } from "ui/components/common/FileDrop"
import { ContainerNames } from "shared/config/CommandContainerConfig"

import { RepoName } from "ui/components/common/Renderers"


// Constants
const
	log = getLogger(__filename)


/**
 * Add component styles
 */
function baseStyles(topStyles, theme, palette) {
	const
		{
			accent,
			warn,
			text,
			secondary
		} = palette
	
	return {
		root: [ FlexColumn, FlexAuto, {} ],
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					fontStyle: 'italic',
					paddingTop: rem(0.3),
					fontSize: rem(1.5),
					fontWeight: 500,
					color: text.secondary
				} ]
			} ],
			
			subTitle: [ makePaddingRem(0, 1.5, 0, 0), {
				textTransform: 'uppercase',
				fontSize: rem(1.6)
			} ]
		} ],
		
		form: [ FlexColumn, FlexScale, Fill, {
			
			editor: [ FlexScale ]
		} ]
	}
}

/**
 * IIssueCommentDialogProps
 */
export interface IIssueCommentDialogProps extends IThemedAttributes {
	open?:boolean
	saving?:boolean
	savingError?:Error
	editCommentRequest?:TEditCommentRequest
}

/**
 * IIssueCommentDialogState
 */
export interface IIssueCommentDialogState {
	comment?:Comment
	mdEditor?:MarkdownEditor
}

/**
 * IssueCommentDialog
 *
 * @class IssueCommentDialog
 * @constructor
 **/
@connect(createStructuredSelector({
	editCommentRequest: editCommentRequestSelector,
	saving: (state) => issueStateSelector(state).issueSaving,
	saveError: (state) => issueStateSelector(state).issueSaveError,
	open: (state) => uiStateSelector(state).dialogs
		.get(Dialogs.IssueCommentDialog) === true
}, createDeepEqualSelector))

// If you have a specific theme key you want to
// merge provide it as the second param
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog')
export class IssueCommentDialog extends React.Component<IIssueCommentDialogProps,IIssueCommentDialogState> {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(CommandType.Container,
				'Save Changes',
				(cmd, event) => this.onSave(event),
				"CommandOrControl+Enter", {
					hidden: true
				})
			.make()
	
	
	commandComponentId = ContainerNames.CommentEditDialog
	
	
	/**
	 * Hide and focus on issue panel
	 */
	hide = () => {
		getUIActions().setDialogOpen(Dialogs.IssueCommentDialog, false)
	}
	//
	// /**
	//  * onBlur
	//  */
	// onBlur = () => {
	// 	log.debug('blur hide')
	// 	this.hide()
	// }
	
	/**
	 * onSave
	 *
	 * @param event
	 */
	onSave = (event = null) => {
		
		const
			issue = _.get(this.props.editCommentRequest, 'issue') as Issue,
			{ comment } = this.state
		
		log.debug('Adding comment to issue', comment, issue)
		
		!this.props.saving &&
		getIssueActions().commentSave({ issue, comment })
	}
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.debug('markdown change', value)
		
		const
			comment = _.get(this.state, 'comment') as Comment
		
		assert(comment, 'Comment can not be null on a markdown update')
		
		const
			updatedComment = assign({}, comment, { body: value })
		
		
		this.setState({
			comment: updatedComment
		})
	}
	
	/**
	 * Set md editor ref
	 *
	 * @param mdEditor
	 */
	private setMarkdownEditor = (mdEditor:MarkdownEditor) => {
		this.setState({ mdEditor })
	}
	
	/**
	 * On drop event handler
	 *
	 * @param data
	 */
	onDrop = (data:DataTransfer) => {
		const
			mde = getValue(() => this.state.mdEditor)
		
		mde.onDrop(data)
	}
	
	
	/**
	 * Update the component state, create data source,
	 * options, etc
	 *
	 * @param props
	 */
	updateState(props:IIssueCommentDialogProps) {
		if (!props.editCommentRequest)
			return
		
		const
			{ comment } = props.editCommentRequest,
			currentComment = _.get(this.state, 'comment') as Comment
		
		if (this.state && (!comment || (currentComment && currentComment.issueNumber === comment.issueNumber)))
			return
		
		this.setState({ comment })
		
	}
	
	/**
	 * Before mount update the state
	 */
	componentWillMount() {
		this.updateState(this.props)
	}
	
	/**
	 * Update state with new props
	 *
	 * @param newProps
	 */
	componentWillReceiveProps(newProps) {
		this.updateState(newProps)
	}
	
	render() {
		if (!this.props.editCommentRequest)
			return React.DOM.noscript()
		
		const
			{
				theme,
				palette,
				editCommentRequest,
				styles,
				saving
			} = this.props,
			
			{ issue } = editCommentRequest,
			
			{ comment } = this.state
		
		
		const
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				<div style={styles.titleBar.label}>
					<RepoName repo={issue.repo}
					          style={makeStyle(styles.titleBar.label,styles.titleBar.label.repo)}/>
				
				</div>
			
			</div>,
			subTitleNode = <div style={styles.titleBar.subTitle}>
				{/*<span>Comment</span>&nbsp;&nbsp;*/}
				<span style={[styles.titleBar.label.number]}>#{issue.number}</span>
			</div>,
			// subTitleNode = <span key={issue.id} style={styles.title.issue}>
			// 		<span style={styles.title.issueNumber}>
			// 			#{issue.number}&nbsp;
			// 		</span>
			// 		<span style={styles.title.issueTitle}>
			// 			{issue.title}
			// 		</span>
			// 	</span>,
			titleActionNodes = createSaveCancelActions(theme, palette, this.onSave, this.hide),
			rootStyle = makeStyle(Fill, FlexScale, FlexColumn)
		
		
		return <CommandRoot
			id={ContainerNames.CommentEditDialog}
			component={this}
			style={rootStyle}>
			
			<DialogRoot
				titleMode='horizontal'
				titleNode={titleNode}
				subTitleNode={subTitleNode}
				titleActionNodes={titleActionNodes}
				saving={saving}
			>
				
				
				<FileDrop onFilesDropped={this.onDrop}
				          acceptedTypes={[/image/]}
				          dropEffect='all'
				          style={rootStyle}>
					
					<form style={[styles.form,saving && styles.form.saving]}>
						
						<MarkdownEditor
							ref={this.setMarkdownEditor}
							autoFocus={true}
							
							onChange={this.onMarkdownChange}
							defaultValue={getValue(() => issue.body)}
							onKeyDown={(event) => getCommandManager().handleKeyDown(event as any,true)}
							style={styles.form.editor}
						/>
					
					
					</form>
				
				</FileDrop>
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}

export default IssueCommentDialog