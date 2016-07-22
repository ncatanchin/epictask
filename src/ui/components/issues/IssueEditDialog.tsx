/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import {AutoWired, Inject, Container} from 'typescript-ioc'
import * as React from 'react'
import {createStructuredSelector} from 'reselect'
import * as ReactDOM from 'react-dom'
import {List,Map} from 'immutable'
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
import {createAvailableRepoSelector, repoIdPredicate, enabledReposSelector} from 'shared/actions/repo/RepoSelectors'
import {IssueState} from 'shared/actions/issue/IssueState'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {CommonKeys} from 'shared/KeyMaps'
import {Milestone} from 'shared/models/Milestone'
import {Themed, ThemedStyles} from 'shared/themes/ThemeManager'
import {appUserSelector} from 'shared/actions/AppSelectors'
import {editingIssueSelector, issueStateSelector} from 'shared/actions/issue/IssueSelectors'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {CircularProgress} from 'material-ui'
import {GithubErrorCodes, IGithubValidationError} from 'shared/GitHubClient'
import {labelModelsSelector} from 'shared/actions/data/DataSelectors'
import {getGithubErrorText} from 'ui/components/common/Renderers'
const {HotKeys} = require('react-hotkeys')
const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium


// Constants
const log = getLogger(__filename)
const uiActions = Container.get(UIActionFactory)

const baseStyles = createStyles({
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

	savingIndicator: [PositionAbsolute,FlexColumnCenter,Fill,makeAbsolute(),{
		opacity: 0,
		pointerEvents: 'none'
	}],

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

		row1: [FlexRow, FlexAlignStart, FillWidth, {overflow:'visible'}],
		row2: [FlexRow, FlexAlignStart, FillWidth, {}],
		row3: [FlexRow, FlexAlignStart, FillWidth, {}]
	}),


})


/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends React.DOMAttributes {
	theme?:any
	styles?:any
	saveError?:any
	editingIssue?:Issue
	availableRepos?:AvailableRepo[]
	repoModels?:Map<string,Repo>
	labelModels?:Map<string,Label>
	open?:boolean
	user?:User
	saving?:boolean
}

export interface IIssueEditDialogState {
	availableRepo?:AvailableRepo
	titleValue?:string
	bodyValue?:string
	labels?:Label[]
	assigneeMenuItems?:any[]
	repoMenuItems?:any[]
	milestoneMenuItems?:any[]
}

/**
 * IssueEditDialog
 *
 * @class IssueEditDialog
 * @constructor
 **/
@Radium
@connect(createStructuredSelector({
	user: appUserSelector,
	editingIssue: editingIssueSelector,
	availableRepos: enabledReposSelector,
	labelModels: labelModelsSelector,
	saving: (state) => issueStateSelector(state).issueSaving,
	saveError: (state) => issueStateSelector(state).issueSaveError,
	open: (state) => uiStateSelector(state).dialogs
		.get(Dialogs.IssueEditDialog) === true

},createDeepEqualSelector))
@ThemedStyles(baseStyles,'dialog','issueEditDialog','form')
@PureRender
//@HotKeyContext()
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,IIssueEditDialogState> {

	repoActions:RepoActionFactory = Container.get(RepoActionFactory)
	issueActions:IssueActionFactory = Container.get(IssueActionFactory)
	uiActions:UIActionFactory = Container.get(UIActionFactory)


	/**
	 * Key handlers for the issue editor
	 *
	 * @type {{}}
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			log.debug('Escaping and moving focus')
			this.hide()
		}
	}


	hide = () => {
		uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
		this.uiActions.focusAppRoot()
	}

	onBlur = () => {
		log.debug('Blurred')
	}

	onCancel = () => this.hide()

	onSave = (event) => {
		!this.props.saving &&
			this.issueActions.issueSave(
				cloneObject(this.props.editingIssue, this.textInputState())
			)
	}


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
		log.debug('markdown change', value)
		this.setState({bodyValue: value})
	}


	onTitleChange = (event, value) => this.setState({titleValue: value})

	onRepoChange = (event, index, value) => {
		const editingIssue = new Issue(assign({},this.props.editingIssue,this.textInputState()))
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


	makeRepoMenuItems(availableRepos:AvailableRepo[], s) {

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

	/**
	 * Create a new state for dialog
	 *
	 * @param props
	 * @returns {{availableRepo: any, bodyValue: any, titleValue: any, repoMenuItems: any[], milestoneMenuItems: (any[]|any), assigneeMenuItems: any}}
	 */
	getNewState(props:IIssueEditDialogProps) {
		const
			{theme,availableRepos,labelModels,editingIssue} = props

		const
			{styles} = this.props

		if (!editingIssue)
			return {} as any

		let repos = _.nilFilter(availableRepos)
		let milestones = _.nilFilter(editingIssue.milestones)
		let collaborators = _.nilFilter(editingIssue.collaborators)
		let labels = []

		const repoId = editingIssue.repoId
		if (editingIssue.id > 0) {
			repos = repos.filter(item => '' + item.repoId === '' + repoId)
		}

		if (editingIssue.repoId) {
			milestones = milestones.filter(item => item.repoId === repoId)
			collaborators = collaborators.filter(item => item.repoIds.includes('' + repoId))

			const repo = repos.find(item => '' + item.repoId === '' + repoId)
			labels = labelModels
				.valueSeq()
				.filter(item => item.repoId === repoId)
				.toArray()
		}



		return {
			availableRepo: editingIssue && availableRepos.find(repoIdPredicate(editingIssue)),
			bodyValue: _.get(editingIssue,'body',''),
			titleValue: _.get(editingIssue,'title',''),
			labels,
			repoMenuItems: this.makeRepoMenuItems(repos, styles),
			milestoneMenuItems: this.makeMilestoneItems(milestones, styles),
			assigneeMenuItems: this.makeAssigneeMenuItems(collaborators, styles)
		}
	}

	componentWillReceiveProps = (nextProps) => this.setState(this.getNewState(nextProps))

	componentWillMount = () => this.setState(this.getNewState(this.props))

	setMilestoneField = (c) => {

	}



	render() {

		const
			{styles,editingIssue,theme, open, user,saveError,saving} = this.props,
			{labels,availableRepo} = this.state,
			repo = availableRepo && availableRepo.repo ? availableRepo.repo : {} as Repo

		if (!editingIssue || !open) {
			assert(!open,'Open is true, but issue is null - invalid!!!!')
			return null
		}

		const canPush = repo.permissions && repo.permissions.push

		const actions = [
			<Button onClick={this.onCancel} style={styles.action}>Cancel</Button>,
			<Button onClick={this.onSave} style={styles.action} mode='raised'>Save</Button>
		]

		const title = <div style={styles.title}>
			<div style={styles.title.label}>
				{editingIssue.id ? `editing ${editingIssue.title}` : `creating ${editingIssue.title || 'an issue'}`}
			</div>
			<div style={styles.title.avatar}>
				<Avatar user={user}
				        prefix='issue being created by'
				        prefixStyle={{padding: '0 0.5rem 0 0'}}
				        labelPlacement='before'
				        labelStyle={styles.title.avatar.label}
				        avatarStyle={styles.title.avatar.avatar}/>
			</div>
		</div>

		const selectMenuStyle = makeStyle(styles.menu,styles.selectList,styles.form.assignee.menu)

		return <Dialog style={styles.root}
		               open={open}
		               actions={actions}
		               actionsContainerStyle={styles.actions}
		               modal={true}
		               overlayStyle={styles.backdrop}
		               autoScrollBodyContent={true}
		               bodyStyle={styles.body}
		               titleStyle={styles.title}
		               title={title}
		               onBlur={this.onBlur}>

			<Style rules={{
				'.CodeMirror': {
					height: '30vh'
				},
				[`.issueEditDialogFormMenuItem:hover`]:styles.menuItem.hover
			}}/>

			{ open &&
			<MuiThemeProvider muiTheme={theme}>
				<HotKeys handlers={this.keyHandlers} style={PositionRelative}>
					<form name="issueEditDialogForm"
					      id="issueEditDialogForm"
					      style={makeStyle(saving && {opacity: 0,pointerEvents: 'none'})}>
						<div style={styles.form.row1}>
							<TextField value={this.state.titleValue}
							           onChange={this.onTitleChange}
							           floatingLabelText="TITLE"
							           floatingLabelStyle={styles.input.floatingLabel}
							           floatingLabelFocusStyle={styles.input.floatingLabelFocus}
							           floatingLabelFixed={false}
							           errorStyle={{transform: 'translate(0,1rem)'}}
							           errorText={getGithubErrorText(saveError,'title')}
							           hintText="I got 99 problems, but issues ain't 1!"
							           hintStyle={styles.input.hint}
							           style={styles.form.title}
							           inputStyle={styles.input}
							           underlineStyle={styles.input.underlineDisabled}
							           underlineDisabledStyle={styles.input.underlineDisabled}
							           underlineFocusStyle={styles.input.underlineFocus}
							           underlineShow={true}
							           fullWidth={true}
							           autoFocus/>
						</div>
						<div style={styles.form.row2}>

							{/* Only show assignee drop down if push permission */}
							{canPush && <SelectField
								value={editingIssue.assignee && editingIssue.assignee.login}
								style={makeStyle(styles.form.assignee,styles.menu)}
								inputStyle={styles.input}
								labelStyle={styles.menu}
								iconStyle={styles.menu}

								floatingLabelText="ASSIGNED TO"
								floatingLabelStyle={styles.input.floatingLabel}
								floatingLabelFocusStyle={styles.input.floatingLabelFocus}
								floatingLabelFixed={false}
								onChange={this.onAssigneeChange}

								underlineStyle={styles.input.underlineDisabled}
								underlineDisabledStyle={styles.input.underlineDisabled}
								underlineFocusStyle={styles.input.underlineFocus}
								menuStyle={selectMenuStyle}
								menuListStyle={styles.select.list}
								underlineShow={true}
								fullWidth={true}>

								{this.state.assigneeMenuItems}
							</SelectField>}

							{/* MILESTONE */}
							<SelectField
								ref={this.setMilestoneField}
								value={editingIssue.milestone && editingIssue.milestone.url}
								style={makeStyle(styles.form.milestone,styles.menu,{listStyle:{padding:0}})}
								selectFieldRoot={styles.selectMenu}
								inputStyle={styles.input}
								labelStyle={styles.menu}
								iconStyle={styles.menu}
								floatingLabelText="MILESTONE"
								floatingLabelStyle={styles.input.floatingLabel}
								floatingLabelFocusStyle={styles.input.floatingLabelFocus}
								floatingLabelFixed={false}
								onChange={this.onMilestoneChange}
								menuStyle={selectMenuStyle}
								menuListStyle={styles.select.list}
								underlineStyle={styles.input.underlineDisabled}
								underlineDisabledStyle={styles.input.underlineDisabled}
								underlineFocusStyle={styles.input.underlineFocus}

								underlineShow={true}
								fullWidth={true}
							>

								{this.state.milestoneMenuItems}
							</SelectField>

							{/* REPO */}
							<SelectField value={editingIssue.repoId}
							             style={makeStyle(styles.form.repo,styles.menu)}
							             inputStyle={styles.input}
							             labelStyle={styles.menu}
							             iconStyle={styles.menu}
							             onChange={this.onRepoChange}
							             underlineStyle={styles.input.underlineDisabled}
							             underlineDisabledStyle={styles.input.underlineDisabled}
							             underlineFocusStyle={styles.input.underlineFocus}
							             menuListStyle={styles.select.list}
							             menuStyle={makeStyle(styles.menu,styles.form.repo.menu)}
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
						                  inputStyle={styles.input}
						                  availableLabels={labels}
						                  onLabelsChanged={this.onLabelsChanged}
						                  underlineStyle={styles.input.underlineDisabled}
						                  underlineFocusStyle={styles.input.underlineFocus}
						                  hintStyle={styles.input.hint}
						                  labelStyle={styles.input.floatingLabel}
						                  labelFocusStyle={styles.input.floatingLabelFocus}/>


						<SimpleMDE onChange={this.onMarkdownChange}
						           style={{maxHeight: 500}}

						           options={{
					            autoDownloadFontAwesome: false,
					            spellChecker: false,
					            initialValue: editingIssue.body,
					            autofocus: false
					           }}/>
					</form>

					{/* Saving progress indicator */}
					<div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
						<CircularProgress
							color={theme.progressIndicatorColor}
							size={1} />
					</div>
				</HotKeys>
			</MuiThemeProvider>
			}
		</Dialog>
	}

}