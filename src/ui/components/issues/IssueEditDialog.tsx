/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import {Container} from 'typescript-ioc'
import * as React from 'react'
import {createStructuredSelector} from 'reselect'
import {Map} from 'immutable'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Issue} from 'shared/models/Issue'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {Repo} from 'shared/models/Repo'
import {User} from 'shared/models/User'
import {Label} from 'shared/models/Label'

import {Dialogs} from 'shared/Constants'
import {PureRender, Renderers, Icon, Button, Avatar, LabelFieldEditor} from 'components'
import {MenuItem, SelectField, TextField, Dialog} from 'material-ui'
import {cloneObject} from 'shared/util'
import {MuiThemeProvider} from 'material-ui/styles'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {repoIdPredicate, enabledReposSelector} from 'shared/actions/repo/RepoSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {CommonKeys} from 'shared/KeyMaps'
import {Milestone} from 'shared/models/Milestone'
import {ThemedStyles, makeThemeFontSize} from 'shared/themes/ThemeManager'
import {appUserSelector} from 'shared/actions/AppSelectors'
import {editingIssueSelector, issueStateSelector} from 'shared/actions/issue/IssueSelectors'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {uiStateSelector} from 'shared/actions/ui/UISelectors'
import {CircularProgress} from 'material-ui'
import {labelModelsSelector} from 'shared/actions/data/DataSelectors'
import {getGithubErrorText} from 'ui/components/common/Renderers'
import {canAssignIssue} from 'shared/Permission'

// import {HotKeyContext} from 'ui/components/common/HotKeyContext'
// import {GithubErrorCodes, IGithubValidationError} from 'shared/GitHubClient'

const {HotKeys} = require('react-hotkeys')
const SimpleMDE = require('react-simplemde-editor')
const {Style} = Radium


// Constants
const log = getLogger(__filename)

const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto],

	action: {},

	input: [{
		padding: '0.3rem 1rem',
		fontWeight: 700,

		floatingLabel: [{
			left: rem(1)
		}],

		floatingLabelFocus: [{
			transform: 'perspective(1px) scale(0.75) translate3d(-10px, -40px, 0px)'
		}],

		underlineFocus: [{
			width: 'auto',
			left: 10,
			right: 10
		}]


	}],

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
			height: 72
		}],

		repo: [FlexScale, {
			height: 50,
			margin: "1.1rem 0 1.1rem 0.5rem",
			padding: "1rem 0",
			menu: [{
				transform: 'translate(0,-30%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					fontSize: makeThemeFontSize(1.2),
					padding: '0 0 0 1rem'
				}]
			}]
		}],


		milestone: [FlexScale, {
			height: 50,
			margin: "1.1rem 0 1.1rem 0.5rem",
			padding: "1rem 0",
			menu: [{
				transform: 'translate(0,-30%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				label: [FlexScale, Ellipsis, {
					fontSize: makeThemeFontSize(1.2),
					padding: '0 0 0 1rem'
				}]
			}]
		}],

		assignee: [FlexScale, {
			height: 50,
			margin: "1.1rem 0 1.1rem 0rem",
			padding: "1rem 0",
			menu: [{
				transform: 'translate(0,-30%)'
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
		row2: [FlexRow, FlexAlignStart, FillWidth, {marginBottom:rem(0.8)}],
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
	open: (state) => uiStateSelector(state)
		.dialogs.get(Dialogs.IssueEditDialog) === true

},createDeepEqualSelector))
@ThemedStyles(baseStyles,'dialog','issueEditDialog','form')
@PureRender
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
		this.uiActions.setDialogOpen(Dialogs.IssueEditDialog, false)
		this.uiActions.focusIssuesPanel()
	}

	onBlur = () => {
		log.debug('Blurred')
	}

	onCancel = this.hide

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
			editingIssue.milestones.find(item => item.id === value)

		this.updateIssueState({milestone})

	}

	onAssigneeChange = (event, index, value) => {
		const {editingIssue} = this.props
		const assignee = !editingIssue || !editingIssue.collaborators ? null :
			editingIssue.collaborators.find(item => item.id === value)

		this.updateIssueState({assignee})
	}

	onLabelsChanged = (newLabels:Label[]) => {
		const {editingIssue} = this.props

		if (editingIssue) {
			this.updateIssueState({labels: newLabels})
		}
	}


	/**
	 * Create milestone items
	 *
	 * @param milestones
	 * @param s
	 * @returns {any[]}
	 */
	makeMilestoneItems(milestones, s) {


		const items = [
			<MenuItem key='empty-milestones'
			          className='issueEditDialogFormMenuItem'
			          style={s.menuItem}
			          value={''}
			          primaryText={<div style={s.form.milestone.item}>
							<Icon iconSet='octicon' iconName='milestone'/>
							<div style={s.form.milestone.item.label}>No milestone</div>
						</div>}/>
		]


		const makeMilestoneLabel = (milestone:Milestone) => (
			<div style={s.form.milestone.item}>
				<Icon iconSet='octicon' iconName='milestone'/>
				<div style={s.form.milestone.item.label}>{milestone.title}</div>
			</div>
		)

		return items.concat(milestones.map(milestone => (
			<MenuItem key={milestone.url}
			          className='issueEditDialogFormMenuItem'
			          value={milestone.id}
			          style={s.menuItem}
			          primaryText={makeMilestoneLabel(milestone)}
			/>
		)))
	}


	/**
	 * Create repo menu items
	 *
	 * @param availableRepos
	 * @param s
	 * @returns {any[]}
	 */
	makeRepoMenuItems(availableRepos:AvailableRepo[], s) {

		const makeRepoLabel = (availRepoItem) => (
			<div style={s.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				<Renderers.RepoName repo={availRepoItem.repo} style={s.form.repo.item.label}/>
				
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

	/**
	 * Create assignee menu items
	 *
	 * @param collabs
	 * @param s
	 * @returns {any[]}
	 */
	makeAssigneeMenuItems(collabs, s) {
		const items = [
			<MenuItem key='empty-milestones'
			          className='issueEditDialogFormMenuItem'
			          style={s.menuItem}
			          value={''}
			          primaryText={<div style={s.form.milestone.item}>
								<Icon iconSet='octicon' iconName='person'/>
								<div style={s.form.milestone.item.label}>Not assigned</div>
							</div>}/>
		]

		const makeCollabLabel = (collab:User) => (
			<Avatar user={collab}
			        labelPlacement='after'
			        style={s.form.assignee.avatar}
			        avatarStyle={s.form.assignee.avatar.avatar}
			        labelStyle={s.form.assignee.avatar.label}
			/>

		)

		return items.concat(collabs.map(collab => (
			<MenuItem key={collab.id}
			          className='issueEditDialogFormMenuItem'
			          value={collab.id}
			          style={s.menuItem}
			          primaryText={makeCollabLabel(collab)}
			/>
		)))
	}

	/**
	 * Create a new state for dialog
	 *
	 * @param props
	 * @returns {{availableRepo: any, bodyValue: any, titleValue: any, repoMenuItems: any[], milestoneMenuItems: (any[]|any), assigneeMenuItems: any}}
	 */
	getNewState(props:IIssueEditDialogProps) {
		const
			{styles,theme,availableRepos,labelModels,editingIssue,open} = props,
			repoId = editingIssue &&editingIssue.repoId

		if (!open)
			return {}

		if (!editingIssue)
			return {} as any

		let
			repos = _.nilFilter(availableRepos),
			milestones = _.nilFilter(editingIssue.milestones),
			collaborators = _.nilFilter(editingIssue.collaborators),
			labels = []


		if (editingIssue.id > 0) {
			repos = repos.filter(item => '' + item.repoId === '' + repoId)
		}

		if (editingIssue.repoId) {
			milestones = milestones.filter(item => item.repoId === repoId)

			collaborators = collaborators.filter(item => item.repoIds.includes(repoId))

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



	render() {

		const
			{styles,editingIssue,theme, open, user,saveError,saving} = this.props,
			{labels,availableRepo} = this.state,
			repo = availableRepo && availableRepo.repo ? availableRepo.repo : {} as Repo

		if (!editingIssue || !open) {
			if (open)
				log.warn('Open is true, but issue is null - invalid!!!!')
			return <div/>
		}

		const canAssign = canAssignIssue(repo)

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

		return <div>
				<Style rules={{
				'.CodeMirror': {
					height: '30vh'
				},
				'.issueEditDialogFormMenuItem:hover':styles.menuItem.hover
			}}/>
			<Dialog style={styles.root}
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



				{ open &&
					<MuiThemeProvider muiTheme={theme}>
						<HotKeys handlers={this.keyHandlers} style={PositionRelative}>
							<form name="issueEditDialogForm"
							      id="issueEditDialogForm"
							      style={makeStyle(saving && {opacity: 0,pointerEvents: 'none'})}>

								<div style={styles.form.row1}>
									<TextField value={this.state.titleValue}
									           onChange={this.onTitleChange}
									           errorStyle={{transform: 'translate(0,1rem)'}}
									           errorText={getGithubErrorText(saveError,'title')}
									           hintText="TITLE"
									           hintStyle={makeStyle(styles.input.hint,{transform: 'translate(1.3rem,-1rem)'})}
									           style={styles.form.title}
									           inputStyle={styles.input}
									           underlineStyle={styles.input.underlineDisabled}
									           underlineDisabledStyle={styles.input.underlineDisabled}
									           underlineFocusStyle={styles.input.underlineFocus}
									           underlineShow={false}
									           fullWidth={true}
									           autoFocus/>
								</div>
								<div style={styles.form.row2}>

									{/* Only show assignee drop down if push permission */}
									{canAssign && <SelectField
										value={editingIssue.assignee ? editingIssue.assignee.id : ''}
										style={makeStyle(styles.form.assignee,styles.menu)}
										inputStyle={styles.input}
										labelStyle={styles.form.assignee.item.label}
										iconStyle={styles.menu}

										onChange={this.onAssigneeChange}

										underlineStyle={styles.input.underlineDisabled}
										underlineDisabledStyle={styles.input.underlineDisabled}
										underlineFocusStyle={styles.input.underlineFocus}
										menuStyle={selectMenuStyle}
										menuListStyle={styles.select.list}
										underlineShow={false}
										fullWidth={true}>

										{this.state.assigneeMenuItems}
									</SelectField>}

									{/* MILESTONE */}
									<SelectField
										value={editingIssue.milestone ? editingIssue.milestone.id : ''}
										style={makeStyle(styles.form.milestone,styles.menu)}
										inputStyle={styles.input}
										labelStyle={styles.form.milestone.item.label}
										iconStyle={styles.menu}

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
									             labelStyle={styles.form.repo.item.label}
									             iconStyle={styles.menu}
									             onChange={this.onRepoChange}
									             underlineStyle={styles.input.underlineDisabled}
									             underlineDisabledStyle={styles.input.underlineDisabled}
									             underlineFocusStyle={styles.input.underlineFocus}
									             menuListStyle={makeStyle(styles.select.list)}
									             menuStyle={makeStyle(styles.menu,styles.form.repo.menu)}
									             underlineShow={true}
									             fullWidth={true}
									>

										{this.state.repoMenuItems}
									</SelectField>
								</div>

								<LabelFieldEditor labels={editingIssue.labels || []}
								                  id="issueEditDialogLabels"
								                  hint="Labels"
								                  hintAlways={true}
								                  style={{marginBottom: rem(1.5)}}
								                  inputStyle={makeStyle(_.omit(styles.input,'width'))}
								                  availableLabels={labels}
								                  onLabelsChanged={this.onLabelsChanged}
								                  underlineStyle={styles.input.underlineDisabled}
								                  underlineFocusStyle={styles.input.underlineFocus}
								                  underlineShow={true}
								                  hintStyle={makeStyle(styles.input.hint,{left:10,bottom: 8})}
								                  chipStyle={{margin: "1rem 0.5rem"}}
								                  labelStyle={makeStyle(styles.input.floatingLabel,{})}
								                  labelFocusStyle={styles.input.floatingLabelFocus}/>


								<SimpleMDE onChange={this.onMarkdownChange}
								           style={{maxHeight: 500}}
								           options={{
									            autoDownloadFontAwesome: false,
									            spellChecker: false,
									            initialValue: editingIssue.body,
									            autoFocus: false
									           }}/>
							</form>

							{/* Saving progress indicator */}
							{saving && <div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
								<CircularProgress
									color={theme.progressIndicatorColor}
									size={1} />
							</div>}
						</HotKeys>
					</MuiThemeProvider>
				}
			</Dialog>
		</div>
	}

}