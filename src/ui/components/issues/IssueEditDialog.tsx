/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import {createStructuredSelector} from 'reselect'
import {List} from 'immutable'
import {connect} from 'react-redux'
import {Issue} from 'shared/models/Issue'
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {Repo} from 'shared/models/Repo'
import {User} from 'shared/models/User'
import {Label} from 'shared/models/Label'

import {Dialogs} from 'shared/Constants'
import {PureRender} from 'ui/components/common/PureRender'
import * as Renderers from 'ui/components/common/Renderers'
import {Icon} from 'ui/components/common/Icon'
import {Button} from 'ui/components/common/Button'
import {Avatar} from 'ui/components/common/Avatar'
import {LabelFieldEditor} from 'ui/components/common/LabelFieldEditor'

import {MenuItem, SelectField, TextField,} from 'material-ui'
import { cloneObject, shallowEquals } from 'shared/util/ObjectUtil'
import {
	repoIdPredicate,
	availableReposSelector
} from 'shared/actions/repo/RepoSelectors'
import {CommonKeys} from 'shared/KeyMaps'
import {Milestone} from 'shared/models/Milestone'
import {ThemedStyles, makeThemeFontSize} from 'shared/themes/ThemeManager'
import {appUserSelector} from 'shared/actions/app/AppSelectors'
import {
	editingIssueSelector,  issueSaveErrorSelector,
	issueSavingSelector
} from 'shared/actions/issue/IssueSelectors'
import {getGithubErrorText} from 'ui/components/common/Renderers'
import { canAssignIssue, canCreateIssue } from 'shared/Permission'
import { DialogRoot } from "ui/components/common/DialogRoot"
import { getUIActions, getRepoActions, getIssueActions } from "shared/actions/ActionFactoryProvider"


const
	log = getLogger(__filename),
	SimpleMDE = require('react-simplemde-editor'),
	{Style} = Radium



const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto],

	issueEdit: [ {
		title: [ {
			avatar: [ FlexAuto, {
				label: {
					fontWeight: 500,
				},
				avatar: {
					height: 30,
					width: 30,
				}
			} ]
		} ],
	}],
	
	input: [{
		padding: '0.3rem 1rem',
		fontWeight: 400,

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

		row1: [FlexRow, FlexAuto,FlexAlignStart, FillWidth, {overflow:'visible'}],
		row2: [FlexRow, FlexAuto,FlexAlignStart, FillWidth, {marginBottom:rem(0.8)}],
		row3: [FlexRow, FlexAuto,FlexAlignStart, FillWidth, {}]
	}),


})


/**
 * IIssueEditDialogProps
 */
export interface IIssueEditDialogProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	saveError?:any
	editingIssue?:Issue
	availableRepos?:List<AvailableRepo>
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


@connect(createStructuredSelector({
	user: appUserSelector,
	editingIssue: editingIssueSelector,
	availableRepos: availableReposSelector,
	saving: issueSavingSelector,
	saveError: issueSaveErrorSelector

}))
@ThemedStyles(baseStyles,'dialog','issueEditDialog','form')
//@PureRender
export class IssueEditDialog extends React.Component<IIssueEditDialogProps,IIssueEditDialogState> {

	repoActions = getRepoActions()
	issueActions = getIssueActions()
	uiActions = getUIActions()
	
	
	shouldComponentUpdate(nextProps:IIssueEditDialogProps,nextState:IIssueEditDialogState) {
		return !shallowEquals(this.state,nextState,'availableRepo','labels','assigneeMenuItems','repoMenuItems','milestoneMenuItems') ||
				!shallowEquals(this.props,nextProps,'theme','styles','editingIssue','saving')
	}

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
		getUIActions().setDialogOpen(Dialogs.IssueEditDialog, false)
		//getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
	}

	onBlur = () => {
		log.debug('Blurred')
	}

	onCancel = this.hide

	onSave = (event) => {
		!this.props.saving &&
			this.issueActions.issueSave(
				cloneObject(this.props.editingIssue, this.textInputState()),
				getChildWindowId()
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
	makeRepoMenuItems(availableRepos:List<AvailableRepo>, s) {

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
			{styles,editingIssue,open} = props,
			repoId = editingIssue && editingIssue.repoId

		if (!editingIssue)
			return {} as any

		
		let
			{availableRepos} = props,
			repos = availableRepos.map(it => it.repo),
			milestones = Array<Milestone>(),
			collaborators = Array<User>(),
			labels = Array<Label>()

		
		if (editingIssue.id > 0) {
			availableRepos = availableRepos.filter(item => item.repoId === repoId) as List<AvailableRepo>
		} else {
			availableRepos = availableRepos.filter(it => canCreateIssue(it.repo)) as List<AvailableRepo>
		}
		
		
		
		// SET REPO LABELS, MILESTONES, COLLABS
		if (editingIssue.repoId) {
			let
				availRepo = availableRepos.find(it => it.id === editingIssue.repoId)
			
			milestones = availRepo.milestones
			collaborators = availRepo.collaborators
			labels =  availRepo.labels
		}



		return {
			availableRepo: editingIssue && availableRepos.find(repoIdPredicate(editingIssue)),
			bodyValue: _.get(editingIssue,'body',''),
			titleValue: _.get(editingIssue,'title',''),
			labels,
			repoMenuItems: this.makeRepoMenuItems(availableRepos, styles),
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

		if (!editingIssue) {
			return <div/>
		}

		const
			canAssign = canAssignIssue(repo),
			
			actionNodes = [
				<Button onClick={this.onCancel} style={styles.action}>Cancel</Button>,
				<Button onClick={this.onSave} style={makeStyle(styles.action,styles.action.save)} mode='raised'>Save</Button>
			],
		 
			titleNode = <div style={styles.issueEdit.title.label}>
					{editingIssue.id ? `EDIT #${editingIssue.number}` : `CREATE`}
				</div>,
			subTitleNode = <div style={styles.issueEdit.title.avatar}>
					<Avatar user={user}
					        prefix='issue being created by'
					        prefixStyle={{padding: '0 0.5rem 0 0'}}
					        labelPlacement='before'
					        labelStyle={styles.title.avatar.label}
					        avatarStyle={styles.title.avatar.avatar}/>
				</div>
			

		const
			selectMenuStyle = makeStyle(styles.menu,styles.selectList,styles.form.assignee.menu)

		return <DialogRoot
			titleMode='horizontal'
			titleNode={titleNode}
			subTitleNode={subTitleNode}
			actionNodes={actionNodes}
			saving={saving}
			>
				{/*<Style rules={{*/}
				{/*'.CodeMirror': {*/}
					{/*height: '30vh'*/}
				{/*},*/}
				{/*'.issueEditDialogFormMenuItem:hover':styles.menuItem.hover*/}
			{/*}}/>*/}
			
			


				
					
								<div style={styles.form.row1}>
									<TextField defaultValue={this.state.titleValue || ''}
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
									           underlineShow={true}
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
								                  mode="normal"
								                  hintAlways={true}
								                  style={{marginBottom: rem(1.5)}}
								                  inputStyle={makeStyle(_.omit(styles.input,'width'))}
								                  availableLabels={labels}
								                  onLabelsChanged={this.onLabelsChanged}
								                  underlineStyle={styles.input.underlineDisabled}
								                  underlineFocusStyle={styles.input.underlineFocus}
								                  underlineDisabledStyle={styles.input.underlineDisabled}
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
									            initialValue: _.get(editingIssue,'body',''),
									            autoFocus: false
									           }}/>
								
				
		</DialogRoot>
	}

}


export default IssueEditDialog