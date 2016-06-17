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
import {Dialogs} from 'shared/Constants'
import {PureRender, Renderers, Icon, Button, Avatar, LabelFieldEditor} from 'components'
import {MenuItem, SelectField, TextField, Dialog,AutoComplete} from 'material-ui'
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

		repo: [FlexScale,{
			height: 72,
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


		milestone: [FlexScale,{
			height: 72,
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

		assignee: [FlexScale,{
			height: 72,
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
			}],

			avatar: makeStyle(FlexRow, makeFlexAlign('center','flex-start'), {
				label:  {
					fontWeight: 500,
				},
				avatar: {
					height: 22,
					width:  22,
				}

			})
		}],

		row1: [FlexRow, FlexAlignStart, FillWidth, {}],
		row2: [FlexRow, FlexAlignStart, FillWidth, {}],
		row3: [FlexRow, FlexAlignStart, FillWidth, {}]
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

	}


	hide = () => appActions.setDialogOpen(Dialogs.IssueEditDialog, false)

	onCancel = () => this.hide()

	onSave = (event) => new RepoActionFactory().issueSave(
		cloneObject(this.props.issue,this.textInputState()))


	textInputState = () => ({
		title:this.state.titleValue,
		body:this.state.bodyValue
	})

	updateIssueState = (newIssueProps) => appActions.updateEditingIssue(
		Object.assign(this.textInputState(),newIssueProps)
	)


	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.info('markdown change',value)
		this.setState({bodyValue:value})
	}



	onTitleChange = (event,value) => this.setState({titleValue:value})

	onRepoChange = (event,index,value) => {
		appActions.updateEditingIssue({repoId: value})
	}

	onMilestoneChange = (event,index,value) => {
		const {issue} = this.props
		const milestone = !issue || !issue.milestones ? null :
			issue.milestones.find(item => item.url === value)

		this.updateIssueState({milestone})

	}

	onAssigneeChange = (event,index,value) => {
		const {issue} = this.props
		const assignee = !issue || !issue.collaborators ? null :
			issue.collaborators.find(item => item.login === value)

		this.updateIssueState({assignee})
	}

	onLabelsChanged = (newLabels:Label[]) => {
		const {issue} = this.props

		log.debug('new labels', newLabels)
		if (issue) {
			this.updateIssueState({labels: newLabels})
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
			          value={milestone.url}
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

	// <div style={s.form.repo.item}>
	// <Icon iconSet='octicon' iconName='person'/>
	// <div style={s.form.assignee.item.label}>
	// {collab.login}
	// </div>
	// </div>
	makeAssigneeMenuItems(collabs,s) {

		const makeCollabLabel = (collab:User) => (
			<Avatar user={collab}
			        labelPlacement='after'
			        style={s.form.assignee.avatar}
			        avatarStyle={s.form.assignee.avatar.avatar}
			        labelStyle={s.form.assignee.avatar.label}
			/>

		)

		return collabs.map(collab => (
			<MenuItem key={collab.login}
			          className='issueEditDialogFormMenuItem'
			          value={collab.login}
			          style={s.menuItem}
			          primaryText={makeCollabLabel(collab)}
			/>
		))
	}

	getNewState(props) {
		const
			{theme, availableRepos,issue} = props,
			s = mergeStyles(styles, theme && theme.dialog, theme && theme.issueEditDialog)

		const milestones = issue && issue.milestones ? issue.milestones : []
		return {
			s,
			bodyValue: (issue) ? issue.body : '',
			titleValue: (issue) ? issue.title : '',
			lastAvailableRepos: availableRepos || [],
			repoMenuItems: !availableRepos ? [] : this.makeRepoMenuItems(availableRepos,s),
			milestoneMenuItems: this.makeMilestoneItems(milestones,s),
			assigneeMenuItems: this.makeAssigneeMenuItems((!issue || !issue.collaborators) ? [] : issue.collaborators,s)
		}
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	componentWillMount() {
		this.setState(this.getNewState(this.props))
	}


	render() {

		const
			{s} = this.state,
			{issue,availableRepo, open, user} = this.props,
			repo = availableRepo && availableRepo.repo ? availableRepo.repo : {} as Repo

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
					<TextField value={this.state.titleValue}
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
				</div>
				<div style={s.form.row2}>

					{/* Only show assignee drop down if push permission */}
					{repo.permissions.push && <SelectField
								 value={issue.assignee && issue.assignee.login}
					             style={makeStyle(s.form.assignee,s.menu)}
					             inputStyle={s.input}
					             labelStyle={s.menu}
					             iconStyle={s.menu}
					             floatingLabelText="ASSIGNED TO"
					             floatingLabelStyle={s.input.floatingLabel}
					             floatingLabelFocusStyle={s.input.floatingLabelFocus}
					             floatingLabelFixed={false}
					             onChange={this.onAssigneeChange}
					             listStyle={makeStyle(s.menu,s.form.assignee.list)}
					             underlineStyle={s.input.underlineDisabled}
					             underlineDisabledStyle={s.input.underlineDisabled}
					             underlineFocusStyle={s.input.underlineFocus}
					             selectFieldRoot={makeStyle(s.menu,s.form.assignee.menu)}
					             underlineShow={true}
					             fullWidth={true}>

						{this.state.assigneeMenuItems}
					</SelectField>}

					{/* MILESTONE */}
					<SelectField value={issue.milestone && issue.milestone.url}
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
					             >

						{this.state.milestoneMenuItems}
					</SelectField>

					{/* REPO */}
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
					             >

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

				           options={{
				           	autoDownloadFontAwesome: false,
				           	spellChecker: false,
				           	initialValue: issue.body,
				           	autofocus: false
				           }}/>
			</form>
		</Dialog>
	}

}