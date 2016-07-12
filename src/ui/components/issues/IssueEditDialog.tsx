/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import {AutoWired, Inject, Container} from 'typescript-ioc'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {List} from 'immutable'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AppState} from 'shared/actions/AppState'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Issue, AvailableRepo, Repo, User, Label} from 'shared/models'
import * as Constants from 'shared/Constants'
import {Dialogs} from 'shared/Constants'
import {PureRender, Renderers, Icon, Button, Avatar, LabelFieldEditor} from 'components'
import {MenuItem, SelectField, TextField, Dialog} from 'material-ui'
import {cloneObject} from 'shared/util'
import {MuiThemeProvider} from 'material-ui/styles'
import {UIState} from 'shared/actions/ui/UIState'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {createAvailableRepoSelector} from 'shared/actions/repo/RepoSelectors'
import {IssueState} from 'shared/actions/issue/IssueState'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {CommonKeys} from 'shared/KeyMaps'
import {Milestone} from 'shared/models/Milestone'
const {HotKeys} = require('react-hotkeys')
const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium

// Constants
const log = getLogger(__filename)
const uiActions = Container.get(UIActionFactory)

const styles = createStyles({
	root: [FlexColumn, FlexAuto],

	action: {},

	input: {
		fontWeight: 700
	},

	title: makeStyle(FlexRowCenter, FillWidth, {
		label: makeStyle(FlexScale),
		avatar: makeStyle(FlexAuto, {
			label: {
				fontWeight: 500,
			},
			avatar: {
				height: 40,
				width: 40,
			}
		})
	}),

	body: makeStyle({}),


	form: makeStyle({
		title: [{
			flex: '1 0 50%',
			padding: "1rem 0",
		}],

		repo: [FlexScale, {
			height: 72,
			padding: "1rem 0",
			menu: [{
				transform: 'translate(0,25%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem'
				}]
			}]
		}],


		milestone: [FlexScale, {
			height: 72,
			padding: "1rem 1rem 1rem 0",
			menu: [{
				transform: 'translate(0,-8px)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem'
				}]
			}]
		}],

		assignee: [FlexScale, {
			height: 72,
			padding: "1rem 1rem 1rem 0",
			menu: [{
				transform: 'translate(0,-8px)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem'
				}]
			}],

			avatar: makeStyle(FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: {
					fontWeight: 500,
				},
				avatar: {
					height: 22,
					width: 22,
				}

			})
		}],

		row1: [FlexRow, FlexAlignStart, FillWidth, {}],
		row2: [FlexRow, FlexAlignStart, FillWidth, {}],
		row3: [FlexRow, FlexAlignStart, FillWidth, {}]
	}),


})


function makeMapStateToProps() {
	const availReposSelector = createAvailableRepoSelector()
	return (state) => {

		const uiState = state.get(Constants.UIKey) as UIState
		const appState = state.get(Constants.AppKey) as AppState
		const issueState = state.get(Constants.IssueKey) as IssueState

		const
			open = uiState.dialogs.get(Dialogs.IssueEditDialog),
			availableRepos = availReposSelector(state),
			editingIssue = issueState.editingIssue



		return {
			theme: getTheme(),
			user: appState.user,
			editingIssue,
			availableRepos,
			open

		}
	}


}

/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends React.DOMAttributes {
	theme?:any
	editingIssue?:Issue
	availableRepos?:List<AvailableRepo>
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


@connect(makeMapStateToProps)
@Radium
@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,any> {

	repoActions:RepoActionFactory = Container.get(RepoActionFactory)

	issueActions:IssueActionFactory = Container.get(IssueActionFactory)


	/**
	 * Key handlers for the issue editor
	 *
	 * @type {{}}
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			log.info('Escaping and moving focus')
			this.hide()
		}
	}


	hide = () => uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)

	onCancel = () => this.hide()

	onSave = (event) => this.issueActions.issueSave(
		cloneObject(this.props.editingIssue, this.textInputState()))


	textInputState = () => ({
		title: this.state.titleValue,
		body: this.state.bodyValue
	})

	updateIssueState = (newIssueProps) => this.issueActions.setEditingIssue(
		new Issue(Object.assign(
			{},
			this.props.editingIssue,
			this.textInputState(),
			newIssueProps
		))
	)


	/**
	 * On body change, just update the state
	 *
	 * @param value
	 */
	onMarkdownChange = (value) => {
		log.info('markdown change', value)
		this.setState({bodyValue: value})
	}


	onTitleChange = (event, value) => this.setState({titleValue: value})

	onRepoChange = (event, index, value) => {
		const editingIssue = new Issue(this.props.editingIssue)
		editingIssue.repoId = value

		this.issueActions.setEditingIssue(editingIssue)
	}

	onMilestoneChange = (event, index, value) => {
		const {editingIssue} = this.props
		const milestone = !editingIssue || !editingIssue.milestones ? null :
			editingIssue.milestones.find(item => item.url === value)

		this.updateIssueState({milestone})

	}

	onAssigneeChange = (event, index, value) => {
		const {editingIssue} = this.props
		const assignee = !editingIssue || !editingIssue.collaborators ? null :
			editingIssue.collaborators.find(item => item.login === value)

		this.updateIssueState({assignee})
	}

	onLabelsChanged = (newLabels:Label[]) => {
		const {editingIssue} = this.props

		log.debug('new labels', newLabels)
		if (editingIssue) {
			this.updateIssueState({labels: newLabels})
		}
	}


	makeMilestoneItems(milestones, s) {

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

		const makeMilestoneLabel = (milestone:Milestone) => (
			<div style={s.form.milestone.item}>
				<Icon iconSet='octicon' iconName='milestone'/>
				<div style={s.form.milestone.item.label}>{milestone.title}</div>
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


	makeRepoMenuItems(availableRepos, s) {

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
	makeAssigneeMenuItems(collabs, s) {

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

	getNewState(props:IIssueEditDialogProps) {
		const
			{theme, availableRepos, editingIssue} = props,
			s = mergeStyles(styles, theme && theme.dialog, theme && theme.issueEditDialog,theme.form)


		const milestones = editingIssue && editingIssue.milestones ? editingIssue.milestones : []

		return {
			s,
			bodyValue: _.get(editingIssue,'body',''),
			titleValue: _.get(editingIssue,'title',''),
			lastAvailableRepos: availableRepos || [],
			repoMenuItems: !availableRepos ? [] : this.makeRepoMenuItems(availableRepos, s),
			milestoneMenuItems: this.makeMilestoneItems(milestones, s),
			assigneeMenuItems: this.makeAssigneeMenuItems((!editingIssue || !editingIssue.collaborators) ? [] : editingIssue.collaborators, s)
		}
	}

	componentWillReceiveProps = (nextProps) => this.setState(this.getNewState(nextProps))

	componentWillMount = () => this.setState(this.getNewState(this.props))

	setMilestoneField = (c) => {

	}

	render() {

		const
			{s} = this.state,
			{editingIssue,theme,availableRepo, open, user} = this.props,
			repo = availableRepo && availableRepo.repo ? availableRepo.repo : {} as Repo

		if (!editingIssue || !open) {
			if (open)
				throw new Error('Open is true, but issue is null - invalid!!!!')

			return null
		}

		const canPush = repo.permissions && repo.permissions.push

		const actions = [
			<Button onClick={this.onCancel} style={s.action}>Cancel</Button>,
			<Button onClick={this.onSave} style={s.action} mode='raised'>Save</Button>
		]

		const title = <div style={s.title}>
			<div style={s.title.label}>
				{editingIssue.id ? `editing ${editingIssue.title}` : `creating ${editingIssue.title || 'an issue'}`}
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

		const selectMenuStyle = makeStyle(s.menu,s.selectList,s.form.assignee.menu)

		return <Dialog style={s.root}
		               open={open}
		               actions={actions}
		               actionsContainerStyle={s.actions}
		               modal={true}
		               overlayStyle={s.backdrop}
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

			<MuiThemeProvider muiTheme={theme}>
				<HotKeys handlers={this.keyHandlers}>
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
							{canPush && <SelectField
								value={editingIssue.assignee && editingIssue.assignee.login}
								style={makeStyle(s.form.assignee,s.menu)}
								inputStyle={s.input}
								labelStyle={s.menu}
								iconStyle={s.menu}

								floatingLabelText="ASSIGNED TO"
								floatingLabelStyle={s.input.floatingLabel}
								floatingLabelFocusStyle={s.input.floatingLabelFocus}
								floatingLabelFixed={false}
								onChange={this.onAssigneeChange}

								underlineStyle={s.input.underlineDisabled}
								underlineDisabledStyle={s.input.underlineDisabled}
								underlineFocusStyle={s.input.underlineFocus}
								menuStyle={selectMenuStyle}
								menuListStyle={s.select.list}
								underlineShow={true}
								fullWidth={true}>

								{this.state.assigneeMenuItems}
							</SelectField>}

							{/* MILESTONE */}
							<SelectField
								ref={this.setMilestoneField}
								value={editingIssue.milestone && editingIssue.milestone.url}
							             style={makeStyle(s.form.milestone,s.menu,{listStyle:{padding:0}})}
							             selectFieldRoot={s.selectMenu}
							             inputStyle={s.input}
							             labelStyle={s.menu}
							             iconStyle={s.menu}
							             floatingLabelText="MILESTONE"
							             floatingLabelStyle={s.input.floatingLabel}
							             floatingLabelFocusStyle={s.input.floatingLabelFocus}
							             floatingLabelFixed={false}
							             onChange={this.onMilestoneChange}
										menuStyle={selectMenuStyle}
										menuListStyle={s.select.list}
							             underlineStyle={s.input.underlineDisabled}
							             underlineDisabledStyle={s.input.underlineDisabled}
							             underlineFocusStyle={s.input.underlineFocus}

							             underlineShow={true}
							             fullWidth={true}
							>

								{this.state.milestoneMenuItems}
							</SelectField>

							{/* REPO */}
							<SelectField value={editingIssue.repoId}
							             style={makeStyle(s.form.repo,s.menu)}
							             inputStyle={s.input}
							             labelStyle={s.menu}
							             iconStyle={s.menu}
							             onChange={this.onRepoChange}
							             underlineStyle={s.input.underlineDisabled}
							             underlineDisabledStyle={s.input.underlineDisabled}
							             underlineFocusStyle={s.input.underlineFocus}
							             menuListStyle={s.select.list}
							             menuStyle={makeStyle(s.menu,s.form.repo.menu)}
							             underlineShow={true}
							             fullWidth={true}
							>

								{this.state.repoMenuItems}
							</SelectField>
						</div>

						<LabelFieldEditor labels={editingIssue.labels || []}
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
					            initialValue: editingIssue.body,
					            autofocus: false
					           }}/>
					</form>
				</HotKeys>
			</MuiThemeProvider>
		</Dialog>
	}

}