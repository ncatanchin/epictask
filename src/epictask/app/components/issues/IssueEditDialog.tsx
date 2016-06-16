/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AppActionFactory} from 'app/actions/AppActionFactory'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {Issue, AvailableRepo, Repo, Milestone, User, Label} from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender, Renderers, Icon, Button, Avatar, LabelFieldEditor} from 'components'
import {MenuItem, SelectField, TextField, Dialog} from 'material-ui'
import {Dialogs} from '../../../shared/Constants'
import {cloneObject} from 'shared/util'

const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium

// Constants
const log = getLogger(__filename)
const appActions = new AppActionFactory()

const styles = createStyles({
	root: [FlexColumn, FlexAuto],

	action: {},

	input: {
		fontWeight: 700
	},
	title: makeStyle(FlexRowCenter, FillWidth, {
		label:  makeStyle(FlexScale),
		avatar: makeStyle(FlexAuto, {
			label:  {
				fontWeight: 500,
			},
			avatar: {
				height: 40,
				width:  40,
			}
		})
	}),

	body: makeStyle({

	}),


	form: makeStyle({
		title: [{
			flex:    '1 0 50%',
			padding: "1rem 0",
		}],

		repo: [{
			height: 72,
			flex:    '0.5 0.5 20%',
			padding: "1rem 0",
			menu: [{
				transform: 'translate(0,25%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item:    [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem'
				}]
			}]
		}],


		milestone: [{
			height: 72,
			flex:    '0.5 0.5 20%',
			padding: "1rem 1rem 1rem 0",
			menu: [{
				transform: 'translate(0,-8px)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item:    [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem'
				}]
			}]
		}],

		row1: [FlexRow, FlexAlignStart, FillWidth, {}],
		row2: [FlexRow, FlexAlignStart, FillWidth, {}]
	}),


})


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	const repoState = state.get(Constants.RepoKey)

	const availableRepos = repoState.availableRepos,
		issue = appState.editingIssue

	return {
		theme:         appState.theme,
		user:          appState.user,
		               issue,
		               availableRepos,
		availableRepo: (!issue) ? null :
			               availableRepos.find(availRepo => availRepo.repoId === issue.repoId),
		open:          appState.dialogs[Dialogs.IssueEditDialog] || false

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

		this.state = this.getNewState(this.props)
	}


	hide = () => appActions.setDialogOpen(Dialogs.IssueEditDialog, false)

	onCancel = () => this.hide()

	onSave = (event) => new RepoActionFactory().issueSave(this.props.issue)

	onMarkdownChange = (value) => appActions.updateEditingIssue({body:value})

	onTitleChange = (event,value) => {
		appActions.updateEditingIssue({title:value})
	}

	onRepoChange = (event,index,value) => {
		appActions.updateEditingIssue({repoId: value})
	}

	onMilestoneChange = (event,index,value) => {
		appActions.updateEditingIssue({milestone:value && value !== '' ? value : null})
	}

	onLabelsChanged = (newLabels:Label[]) => {
		const {issue} = this.props

		log.debug('new labels', newLabels)
		if (issue) {
			appActions.updateEditingIssue({labels: newLabels})
		}
	}

	makeMilestoneItems(milestones,s) {

		if (!milestones.length) {
			return [
				<MenuItem key='empty-milestones'
				          className='issueEditDialogFormMenuItem'
				          style={s.menuItem}
				          value={''}
				          primaryText={<div style={s.form.milestone.item}>
								<Icon iconSet='octicon' iconName='milestone'/>
								<div style={s.form.milestone.item.label}>No milestones</div>
							</div>}/>
			]
		}

		const makeMilestoneLabel = (milestone) => (
			<div style={s.form.milestone.item}>
				<Icon iconSet='octicon' iconName='milestone'/>
				<div style={s.form.milestone.item.label}>{milestone.name}</div>
			</div>
		)

		return milestones.map(milestone => (
			<MenuItem key={milestone.url}
			          className='issueEditDialogFormMenuItem'
			          value={milestone}
			          style={s.menuItem}
			          primaryText={makeMilestoneLabel(milestone)}
			/>
		))
	}


	makeRepoMenuItems(availableRepos,s) {

		const makeRepoLabel = (availRepoItem) => (
			<div style={s.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				{Renderers.repoName(availRepoItem.repo, s.form.repo.item.label)}
			</div>
		)

		return availableRepos.map(availRepoItem => (
			<MenuItem key={availRepoItem.repoId}
			          className='issueEditDialogFormMenuItem'
			          value={availRepoItem.repoId}
			          style={s.menuItem}
			          primaryText={makeRepoLabel(availRepoItem)}
			/>
		))
	}

	getNewState(props) {
		const
			{theme, availableRepos,issue} = this.props,
			s = mergeStyles(styles, theme && theme.dialog, theme && theme.issueEditDialog)

		const milestones = issue && issue.milestones ? issue.milestones : []
		return {
			s,
			lastAvailableRepos: availableRepos || [],
			repoMenuItems: !availableRepos ? [] : this.makeRepoMenuItems(availableRepos,s),
			milestoneMenuItems: this.makeMilestoneItems(milestones,s),
		}
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	render() {

		const
			{s} = this.state,
			{issue,availableRepo, open, user} = this.props

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
				        avatarStyle={s.title.avatar.avatar}/>
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
				},
				[`.issueEditDialogFormMenuItem:hover`]:s.menuItem.hover
			}}/>

			<form name="" id="issueEditDialogForm">
				<div style={s.form.row1}>
					<TextField value={issue.title}
					           onChange={this.onTitleChange}
					           floatingLabelText="TITLE"
					           floatingLabelStyle={s.input.floatingLabel}
					           floatingLabelFocusStyle={s.input.floatingLabelFocus}
					           floatingLabelFixed={false}
					           hintText="I got 99 problems, but issues ain't 1!"
					           hintStyle={s.input.hint}
					           style={s.form.title}
					           inputStyle={s.input}
					           underlineStyle={s.input.underlineDisabled}
					           underlineDisabledStyle={s.input.underlineDisabled}
					           underlineFocusStyle={s.input.underlineFocus}
					           underlineShow={true}
					           fullWidth={true}
					           autoFocus/>

					<SelectField value={issue.milestone}
					             style={makeStyle(s.form.milestone,s.menu)}
					             inputStyle={s.input}
					             labelStyle={s.menu}
					             iconStyle={s.menu}
					             floatingLabelText="MILESTONE"
					             floatingLabelStyle={s.input.floatingLabel}
					             floatingLabelFocusStyle={s.input.floatingLabelFocus}
					             floatingLabelFixed={false}
					             onChange={this.onMilestoneChange}
					             listStyle={makeStyle(s.menu,s.form.milestone.list)}
					             underlineStyle={s.input.underlineDisabled}
					             underlineDisabledStyle={s.input.underlineDisabled}
					             underlineFocusStyle={s.input.underlineFocus}
					             selectFieldRoot={makeStyle(s.menu,s.form.milestone.menu)}
					             underlineShow={true}
					             fullWidth={true}
					             autoFocus>

						{this.state.milestoneMenuItems}
					</SelectField>
					<SelectField value={issue.repoId}
					             style={makeStyle(s.form.repo,s.menu)}
					             inputStyle={s.input}
					             labelStyle={s.menu}
					             iconStyle={s.menu}
					             onChange={this.onRepoChange}
					             listStyle={makeStyle(s.menu,s.form.repo.list)}
					             underlineStyle={s.input.underlineDisabled}
					             underlineDisabledStyle={s.input.underlineDisabled}
					             underlineFocusStyle={s.input.underlineFocus}
					             selectFieldRoot={makeStyle(s.menu,s.form.repo.menu)}
					             underlineShow={true}
					             fullWidth={true}
					             autoFocus>

						{this.state.repoMenuItems}
					</SelectField>
				</div>

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