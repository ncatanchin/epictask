/**
 * Created by jglanz on 7/24/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {Button} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'

import {Dialog} from 'material-ui'
import { HotKeys } from "ui/components/common/Other"
import {MuiThemeProvider} from 'material-ui/styles'
import {Container} from 'typescript-ioc'


import {ThemedStyles} from 'shared/themes/ThemeManager'
import {Comment} from 'shared/models/Comment'
import {Issue} from 'shared/models/Issue'

import {
	issueStateSelector,
	editCommentRequestSelector
} from 'shared/actions/issue/IssueSelectors'

import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {Dialogs} from 'shared/Constants'

import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {cloneObject} from 'shared/util/ObjectUtil'
import { TEditCommentRequest } from "shared/actions/issue/IssueState"


// Constants
const
	log = getLogger(__filename),
	tinycolor = require('tinycolor2'),
	SimpleMDE = require('react-simplemde-editor')


/**
 * Add component styles
 */
const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto, {}],

	title: [FlexColumn, FillWidth, {
		action: [FlexRow],
		issues: [FlexRow, FillWidth, OverflowAuto,{
			fontSize: rem(1)

		}],
		issueNumber: [{
			//fontStyle: 'italic',
			fontWeight: 500
		}],
		issueTitle: [{
			fontWeight: 300
		}]
	}],

	form: {
		paddingTop: rem(2)
	},

	row: [{
		height: 72
	}],

	savingIndicator: [PositionAbsolute,FlexColumnCenter,Fill,makeAbsolute(),{
		opacity: 0,
		pointerEvents: 'none'
	}],

})

/**
 * IIssueCommentDialogProps
 */
export interface IIssueCommentDialogProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?: any
	open?: boolean
	saving?: boolean
	savingError?: Error
	editCommentRequest?:TEditCommentRequest
}

/**
 * IIssueCommentDialogState
 */
export interface IIssueCommentDialogState {
	comment?:Comment
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
@ThemedStyles(baseStyles, 'dialog')
export class IssueCommentDialog extends React.Component<IIssueCommentDialogProps,IIssueCommentDialogState> {


	issueActions: IssueActionFactory = Container.get(IssueActionFactory)
	uiActions: UIActionFactory= Container.get(UIActionFactory)


	/**
	 * Hide and focus on issue panel
	 */
	hide = () => {
		this.setState({comment: null})
		this.uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
		this.uiActions.focusIssuesPanel()
	}

	/**
	 * onBlur
	 */
	onBlur = () => {
		log.info('blur hide')
		this.hide()
	}

	/**
	 * onSave
	 *
	 * @param event
	 */
	onSave = (event = null) => {

		const
			issue = _.get(this.props.editCommentRequest,'issue') as Issue,
			{comment} = this.state
		
		log.info('Adding comment to issue', comment,issue)

		!this.props.saving &&
			this.issueActions.commentSave({issue,comment})
	}
	
	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.info('markdown change', value)
		const comment = _.get(this.state,'comment') as Comment
		assert(comment, 'Comment can not be null on a markdown update')
		
		const updatedComment = Object.assign(cloneObject(comment),{body:value})
		
		
		this.setState({
			comment: updatedComment
		})
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
			{comment} = props.editCommentRequest,
			currentComment = _.get(this.state,'comment') as Comment
		
		if (this.state && (!comment || (currentComment && currentComment.issueNumber === comment.issueNumber)))
			return
			
		this.setState({comment})

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
				editCommentRequest,
				open,
				styles,
				saving
			} = this.props,
			{	issue } = editCommentRequest,
			{ comment } = this.state
			

		
		const actions = [
			<Button onClick={this.hide} style={styles.action}>Cancel</Button>,
			<Button onClick={this.onSave} style={styles.action} mode='raised'>Save</Button>
		]

		// Create title row
		const makeTitle = () => <div style={styles.title}>
			<div style={styles.title.action}>
				{comment.id ? 'Edit Comment' : 'Create Comment'}
			</div>
			<div style={styles.title.issues}>
				<span key={issue.id} style={styles.title.issue}>
					<span style={styles.title.issueNumber}>
						#{issue.number}&nbsp;
					</span>
					<span style={styles.title.issueTitle}>
						{issue.title}
					</span>
				</span>
			</div>
		</div>


		return <div>
			<Dialog style={styles.root}
			        open={open}
			        actions={actions}
			        actionsContainerStyle={styles.actions}
			        modal={true}
			        overlayStyle={styles.backdrop}
			        autoScrollBodyContent={true}
			        bodyStyle={styles.body}
			        titleStyle={styles.title}
			        title={open && comment && makeTitle()}
			        onBlur={this.onBlur}>


				{ open && comment &&
				<MuiThemeProvider muiTheme={theme}>
					<HotKeys style={PositionRelative}>

						<form name="issuePatchDialogForm"
						      id="issuePatchDialogForm"
						      style={[
						      	styles.form,saving && {opacity: 0,pointerEvents: 'none'}
						      ]}>
							
							<SimpleMDE onChange={this.onMarkdownChange}
							           style={{
							           	maxHeight: 500
							           }}
							           options={{
									            autoDownloadFontAwesome: false,
									            spellChecker: false,
									            initialValue: comment.body,
									            autoFocus: false
									           }}/>
						</form>

						{/* Saving progress indicator */}
						{saving && <div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
							{/*<CircularProgress*/}
								{/*color={theme.progressIndicatorColor}*/}
								{/*size={1}/>*/}
						</div>}
					</HotKeys>
				</MuiThemeProvider>
				}
			</Dialog>
		</div>
	}

}

export default IssueCommentDialog