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

const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium

// Constants
const log = getLogger(__filename)
const appActions = new AppActionFactory()

const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {}),

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
	return Object.assign({}, _.pick(appState, [
		'theme',
		'user'
	]), _.pick(repoState, [
		'availableRepos',
		'selectedIssue'
	]), {
		open: appState.ui.dialogs[IssueEditDialog.name] || false,
		repos: repoState.availableRepos.map(availRepo => availRepo.repo)
	})
}

/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends React.DOMAttributes {
	theme?:any
	issue?:Issue
	availableRepos?:AvailableRepo[]
	repos?:Repo[]
	selectedIssue?:Issue
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

		this.state = this.getNewState(props)
	}

	getNewState(props,repoId = null) {
		const {selectedIssue, availableRepos,repos} = props


		function newIssue() {


			repoId = (repoId) ? repoId :
				(selectedIssue) ? selectedIssue.repoId :
					(availableRepos && availableRepos[0]) ? availableRepos[0].repoId :
						(repos && repos[0]) ? repos[0].id :
							null
			return new Issue({repoId})
		}

		const {state} = this
		const issue = (state && state.issue && (!props.issue || props.issue.id === state.issue.id)) ?
			state.issue : (props.issue) ? _.cloneDeep(props.issue) : newIssue()

		//const repo = repos.find(repo => repo.id === issue.repoId)
		return {issue,availableRepo:availableRepos.find(availRepo => availRepo.repoId === issue.repoId)}
	}

	/**
	 * Check to see if the issue has changed since we last received it
	 *
	 * @param props
	 */
	updateState(props) {
		const
			{state} = this

		if (!state || !state.issue || state.issue.updated_at !== (props.issue ? props.issue.updated_at : -1)) {
			this.setState(this.getNewState(props))
		}
	}

	componentWillReceiveProps(nextProps) {
		this.updateState(nextProps)
	}

	onCancel = () => {
		appActions.setDialogOpen(IssueEditDialog.name, false)
	}

	onSave = () => {
		log.info('Its time to save')
	}

	onMarkdownChange = (event) => {
		log.info(`Markdown changed`,event)
	}

	onLabelsChanged = (newLabels:Label[]) => {

	}

	render() {
		const
			{theme, open,user} = this.props,
			{issue,availableRepo} = this.state,
			s = mergeStyles(styles, theme.dialog,theme.issueEditDialog)

		const actions = [
			<Button onClick={this.onCancel}>Cancel</Button>,
			<Button onClick={this.onSave} mode='raised'>Save</Button>
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
		               modal={true}
		               bodyStyle={s.body}
		               titleStyle={s.title}
		               title={title}>

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
				           fullWidth={true} />

				<LabelFieldEditor labels={issue.labels || []}
				                  availableLabels={availableRepo ? availableRepo.labels : []}
				                  onLabelsChanged={this.onLabelsChanged} />

				<SimpleMDE onChange={this.onMarkdownChange}
				           options={{value:issue.body}}></SimpleMDE>
			</form>
		</Dialog>
	}

}