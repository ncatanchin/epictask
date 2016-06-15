/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {Issue, AvailableRepo, Repo, Milestone, User, Label} from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender, Button,Avatar,LabelFieldEditor} from 'components'
import {TextField,Dialog} from 'material-ui'
import {Dialogs} from '../../../shared/Constants'

const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium

// Constants
const log = getLogger(__filename)
const appActions = new AppActionFactory()

const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {}),

	action: {

	},

	input: {
		fontWeight: 700
	},
	title: makeStyle(FlexRowCenter,FillWidth,{
		label: makeStyle(FlexScale),
		avatar: makeStyle(FlexAuto,{
			label: {
				fontWeight: 500,
			},
			avatar: {
				height: 40,
				width: 40,
			}
		})
	}),

	body: makeStyle({

	}),

	titleInput: makeStyle({
		padding: "1rem 0"
	})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	const repoState = state.get(Constants.RepoKey)

	const availableRepos = repoState.availableRepos,
		issue = appState.editingIssue

	return {
		theme: appState.theme,
		user: appState.user,
		issue,
		availableRepos,
		availableRepo: (!issue) ? null :
               availableRepos.find(availRepo => availRepo.repoId === issue.repoId),
		open: appState.dialogs[Dialogs.IssueEditDialog] || false

	}

}

/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends React.DOMAttributes {
	theme?:any
	issue?:Issue
	availableRepos?:AvailableRepo[]
	availableRepo?:AvailableRepo
	open?:boolean
	user?:User
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,any> {


	constructor(props, context) {
		super(props, context)
	}


	onCancel = () => {
		appActions.setDialogOpen(Dialogs.IssueEditDialog, false)
	}

	onSave = () => {
		log.info('Its time to save')
	}

	onMarkdownChange = (event) => {
		log.info(`Markdown changed`,event)
	}

	onLabelsChanged = (newLabels:Label[]) => {
		const {issue} = this.props

		log.info('new labels',newLabels)
		if (issue) {
			appActions.updateEditingIssue({labels:newLabels})
		}
	}

	render() {

		const
			{theme,issue,availableRepo,open,user} = this.props,
			s = mergeStyles(styles, theme.dialog,theme.issueEditDialog)

		if (!issue)
			return null

		const actions = [
			<Button onClick={this.onCancel} style={s.action}>Cancel</Button>,
			<Button onClick={this.onSave} style={s.action} mode='raised'>Save</Button>
		]

		const title = <div style={s.title}>
			<div style={s.title.label}>
				{issue.id ? `editing ${issue.title}` : `creating ${issue.title || 'an issue'}`}
			</div>
			<div style={s.title.avatar}>
				<Avatar user={user}
				        prefix='issue being created by'
				        prefixStyle={{padding: '0 0.5rem 0 0'}}
				        labelPlacement='before'
				        labelStyle={s.title.avatar.label}
				        avatarStyle={s.title.avatar.avatar} />
			</div>
		</div>
		return <Dialog style={s.root}
		               open={open}
		               actions={actions}
		               actionsContainerStyle={s.actions}
		               modal={true}
		               autoScrollBodyContent={true}
		               bodyStyle={s.body}
		               titleStyle={s.title}
		               title={title}>

			<Style rules={{
				'.CodeMirror': {
					height: '30vh'
				}
			}} />

			<form name="issueEditDialogForm" id="issueEditDialogForm">

				<TextField value={issue.title}
				           floatingLabelText="TITLE"
				           hintText="I got 99 problems, but issues ain't 1!"
				           hintStyle={s.input.hint}
				           style={s.titleInput}
				           inputStyle={s.input}
				           floatingLabelStyle={s.input.floatingLabel}
				           floatingLabelFocusStyle={s.input.floatingLabelFocus}
				           floatingLabelFixed={false}
				           underlineStyle={s.input.underlineDisabled}
				           underlineDisabledStyle={s.input.underlineDisabled}
				           underlineFocusStyle={s.input.underlineFocus}
				           underlineShow={true}
				           fullWidth={true}
							autoFocus />

				<LabelFieldEditor labels={issue.labels || []}
				                  id="issueEditDialogLabels"
				                  label="LABELS"
				                  hint="Label me..."
				                  inputStyle={s.input}
				                  availableLabels={availableRepo ? availableRepo.labels : []}
				                  onLabelsChanged={this.onLabelsChanged}
				                  underlineStyle={s.input.underlineDisabled}
				                  underlineFocusStyle={s.input.underlineFocus}
				                  hintStyle={s.input.hint}
				                  labelStyle={s.input.floatingLabel}
				                  labelFocusStyle={s.input.floatingLabelFocus}/>

				<SimpleMDE onChange={this.onMarkdownChange}
				           style={{maxHeight: 500}}
				           options={{value:issue.body}}></SimpleMDE>
			</form>
		</Dialog>
	}

}