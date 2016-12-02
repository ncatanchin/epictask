/**
 * Created by jglanz on 7/24/16.
 */
// Imports
import { getValue, cloneObjectShallow } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Comment, Issue } from "epic-models"
import { getUIActions } from "epic-typedux"
import { CommandType, ContainerNames } from "epic-command-manager"
import { CommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { MarkdownEditor, FileDrop, RepoLabel } from "epic-ui-components/common"
import { createSaveCancelActions, DialogRoot } from "epic-ui-components/layout/dialog"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"
import { CommentEditState } from "epic-ui-components/pages/comment-edit/CommentEditState"
import CommentEditController from "epic-ui-components/pages/comment-edit/CommentEditController"


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
export interface ICommentEditDialogProps extends IThemedAttributes {
	saving?:boolean
	savingError?:Error
	
	viewState?:CommentEditState
	viewController?:CommentEditController
}

/**
 * IIssueCommentDialogState
 */
export interface ICommentEditDialogState {
	mdEditor?:MarkdownEditor
}

/**
 * IssueCommentDialog
 *
 * @class IssueCommentDialog
 * @constructor
 **/
@ViewRoot(CommentEditController,CommentEditState)
// If you have a specific theme key you want to
// merge provide it as the second param
@CommandComponent()
@ThemedStyles(baseStyles, 'dialog')
export class CommentEditDialog extends React.Component<ICommentEditDialogProps,ICommentEditDialogState> {
	
	
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
	
	
	private get viewState():CommentEditState {
		return getValue(() => this.props.viewState)
	}
	
	private get viewController() {
		return getValue(() => this.props.viewController)
	}
	
	private get editingComment() {
		return getValue(() => this.viewState.editingComment,new Comment())
	}
	
	private get issue() {
		return getValue(() => this.viewState.issue,new Issue())
	}
	
	
	/**
	 * Hide and focus on issue panel
	 */
	hide = () => {
		getUIActions().closeWindow(getWindowId())
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
		
		this.viewController.save()
		
		// const
		// 	issue = _.get(this.props.editCommentRequest, 'issue') as Issue,
		// 	{ comment } = this.state
		//
		// log.debug('Adding comment to issue', comment, issue)
		//
		// !this.props.saving &&
		// getIssueActions().saveComment(issue, comment)
	}
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.debug('markdown change', value)
		
		this.viewController.setEditingComment(
			cloneObjectShallow(this.editingComment, { body: value })
		)
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
	 * Before mount update the state
	 */
	componentWillMount() {
		
		this.viewController.setMounted(
			true,
			this.props
		)
		
		
	}
	
	/**
	 * Update state with new props
	 *
	 * @param newProps
	 */
	componentWillReceiveProps(newProps) {
		
	}
	
	render() {
		const
			{editingComment:comment,issue} = this,
			ready = this.viewState.ready
		
		if (!ready || !comment || !issue)
			return React.DOM.noscript()
		
		const
			{
				theme,
				palette,
				styles,
				saving
			} = this.props
		
		const
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				<div style={styles.titleBar.label}>
					<RepoLabel repo={issue.repo}
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
					
					
						
						<MarkdownEditor
							ref={this.setMarkdownEditor}
							autoFocus={true}
							
							onChange={this.onMarkdownChange}
							defaultValue={getValue(() => comment.body)}
							onKeyDown={(event) => getCommandManager().handleKeyDown(event as any,true)}
							style={styles.form.editor}
						/>
					
					
					
				
				</FileDrop>
			
			
			</DialogRoot>
		</CommandRoot>
	}
	
}

export default CommentEditDialog