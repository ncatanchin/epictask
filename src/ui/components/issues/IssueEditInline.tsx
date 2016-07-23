/**
 * Created by jglanz on 7/21/16.
 */

// Imports
import * as React from 'react'
import {PureRender, Avatar, LabelFieldEditor, Icon, Button} from 'components/common'
import {Issue} from 'models/Issue'
import {Label} from 'models/Label'
import {Milestone} from 'models/Milestone'
import filterProps from 'react-valid-props'
import {repoName, getGithubErrorText} from 'ui/components/common/Renderers'
import {IssueLabelsAndMilestones} from 'components/issues'
import {TextField} from 'material-ui'
import {ThemedStyles, makeThemeFontSize} from 'shared/themes/ThemeManager'
import {Repo} from 'models/Repo'
import {Map} from 'Immutable'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {repoModelsSelector} from 'shared/actions/data/DataSelectors'
import {
	editingIssueSelector, labelsSelector, milestonesSelector,
	issueStateSelector
} from 'actions/issue/IssueSelectors'
import {CircularProgress} from 'material-ui'
import {HotKeyContext} from 'components/common/HotKeyContext'
import {HotKeys} from 'react-hotkeys'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {Container} from 'typescript-ioc'
import {CommonKeys} from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import Radium = require('radium')
import {AvailableRepo} from 'models/AvailableRepo'
import {MenuItem} from 'material-ui'
import {SelectField} from 'material-ui'
import {enabledReposSelector} from 'shared/actions/repo/RepoSelectors'

// Constants
const log = getLogger(__filename)
const ReactTimeout = require('react-timeout')

//region Styles
const baseStyles = createStyles({
	root: [FlexColumn, FlexAuto,makeTransition('opacity')],
	savingIndicator: [makeTransition('opacity'),PositionAbsolute,FlexColumnCenter,Fill,makeAbsolute(),{
		opacity: 0,
		pointerEvents: 'none'
	}],

	issueRepo: makeStyle(Ellipsis, FlexRow, FlexScale, {
		fontSize: themeFontSize(1),
		padding:  '0 0 0.5rem 0rem'
	}),

	issue: [
		FlexColumn,
		FlexAuto,
		FillWidth,
		FlexAlignStart,
		PositionRelative,
		makeTransition(['background-color']), {

			padding: '0.5rem 1rem',
			cursor: 'pointer',
			boxShadow: 'inset 0 0.4rem 0.6rem -0.6rem black',

			// Issue selected
			selected: [],

			// Avatar component
			avatar: [{
				padding: '0'
			}],

			labels: [FlexScale, {
				padding: '0 0 0 0',
				//overflow: 'auto',
				flexWrap: 'wrap',

				label: {
					margin: '0.5rem 0.7rem 0rem 0',
				}

			}],
			repo: [FlexRow, makeFlexAlign('flex-start', 'flex-start'), {
				//pointerEvents: 'none',

				text: [{

				}]
			}]
		}
	],

	input: {
		height: 38,
		fontWeight: 700,
		padding: '0.5rem 1rem',
		margin: '0.5rem 0',

		hint: {
			zIndex: 10,
			paddingLeft: rem(1)
		}

	},

	menu: {
		width: 'auto',
		lineHeight: rem(3),
	},

	form: [{

		title: [{
			flex: '1 0 50%',
			padding: "0",
		}],

		repo: [FlexScale, {
			//height: 30,

			padding: "0 0",
			margin: '0 0 1rem 0',
			menu: [{
				transform: 'translate(0,25%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				lineHeight: "3rem",
				fontSize: rem(1),
				fontWeight: 400,
				label: [FlexScale, Ellipsis, {
					padding: '0 0 0 1rem',

				}]
			}]
		}],


		milestone: [FlexScale, {

			padding: 0,
			margin: '0 0 1rem 0',
			menu: [{
				transform: 'translate(0,25%)'
			}],
			list: [{
				padding: '0 0 0 0 !important'
			}],
			item: [FlexRow, makeFlexAlign('center', 'flex-start'), {
				lineHeight: "3rem",
				fontSize: rem(1),
				fontWeight: 400,
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



	}],
	row: [FlexRow, FlexAlignStart, FillWidth, OverflowHidden,{
		alignItems: 'center',
		spacer: [FlexScale],
		action: [FlexRowCenter,FlexAuto,{
			height: rem(3),
			icon: [FlexAuto,FlexColumnCenter,{
				fontSize: makeThemeFontSize(1.3),
				padding: '0.3rem 1rem 0.3rem 0'
			}],
			label: [FlexAuto,FlexColumnCenter]
		}]
	}]


})
//endregion


/**
 * IIssueEditInlineProps
 */
export interface IIssueEditInlineProps extends React.HTMLAttributes {
	styles?: any
	theme?: any
	saveError?:Error
	saving?:boolean
	issue?:Issue
	labels?:Label[]
	repo?:Repo
	milestones?:Milestone[]
	setTimeout?:Function
	clearTimeout?:Function
	availableRepos?:AvailableRepo[]

}

/**
 * IIssueEditInlineState
 */
export interface IIssueEditInlineState {
	textField?:any
	focused?:boolean
	labelField?:any
	hideTimer?:any
}

/**
 * IssueCreateInline
 *
 * @class IssueEditInline
 * @constructor
 **/

@connect(createStructuredSelector({
	repoModels: repoModelsSelector,
	repo: (state,props) => repoModelsSelector(state)
		.get(`${_.get(editingIssueSelector(state),'repoId')}`),

	issue: editingIssueSelector,
	availableRepos: enabledReposSelector,
	labels: labelsSelector,
	milestones: milestonesSelector,
	saving: (state) => issueStateSelector(state).issueSaving,
	saveError: (state) => issueStateSelector(state).issueSaveError
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'inline','issueEditDialog','form')
@HotKeyContext()
@PureRender
@Radium
@ReactTimeout
export class IssueEditInline extends React.Component<IIssueEditInlineProps,IIssueEditInlineState> {

	issueActions = Container.get(IssueActionFactory)
	uiActions = Container.get(UIActionFactory)

	private get issue():Issue {
		return _.get(this.props,'issue') as any
	}


	/**
	 * Key handlers
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			this.hide()
			this.uiActions.focusIssuesPanel()
		},
		[CommonKeys.Enter]: () => {
			log.info('Consuming enter pressed')
		}
	}




	/**
	 * Title input changed
	 *
	 */
	onTitleChange = (event,title) => this.issueActions
		.setEditingIssue(_.cloneDeep(assign({},this.issue,{title})),true)


	/**
	 * Selected repo changed
	 *
	 * @param event
	 * @param index
	 * @param repoId
	 */
	onRepoChange = (event, index, repoId) => {
		const {issue} = this.props


		this.issueActions.setEditingIssue(_.cloneDeep(assign({},issue,{
			milestone:null,
			labels:[],
			repoId
		})),true)
	}

	/**
	 * Selected milestone changed
	 *
	 * @param event
	 * @param index
	 * @param value
	 */
	onMilestoneChange = (event, index, value) => {

		const {issue,milestones} = this.props

		const milestone = milestones.find(item => item.url === value)
		const newIssue = _.cloneDeep(assign({},issue,{
			milestone
		}))
		log.info('Milestone set issue=',issue,'milestone',milestone,'value',value,'milestones',milestones,'newIssue',newIssue)
		// this.setState({
		// 	issue:newIssue
		// })
		this.issueActions.setEditingIssue(newIssue,true)
		//this.updateIssueState({milestone})

	}


	onAssigneeChange = (event, index, value) => {
		// const {editingIssue} = this.props
		// const assignee = !editingIssue || !editingIssue.collaborators ? null :
		// 	editingIssue.collaborators.find(item => item.login === value)

		//this.updateIssueState({assignee})
	}

	onLabelsChanged = (labels:Label[]) => {
		const {issue} = this

		const newIssue = _.cloneDeep(assign({},issue,{labels}))
		this.issueActions.setEditingIssue(newIssue,true)

	}

	setTextField = (textField) => {
		// if (textField)
		// 	textField.focus()
		if (textField)
			this.setState({textField})
	}

	setLabelFieldRef = (labelField) => {
		this.setState({labelField})
	}

	/**
	 * Hide the editor field
	 */

	hide = () => {
		this.issueActions.setEditingInline(false)
	}

	/**
	 * Save the issue
	 */
	save = () => {
		this.issueActions.issueSave(_.cloneDeep(this.props.issue))
	}

	/**
	 * When blurred, hide after delay in case another field is selected
	 * in inline form
	 *
	 * @param event
	 *
	 */
	onBlur = (event) => {
		log.info('Inline edit blurred',document.activeElement)

		if (ReactDOM.findDOMNode(this).contains(document.activeElement) || document.activeElement === document.body) {
			log.info('we still have focus, probably clicked another window')
			return
		}

		this.setState({
			focused:false,
			hideTimer: this.props.setTimeout(this.hide,500)
		})

	}

	/**
	 * on focus event
	 *
	 * @param event
	 */
	onFocus = (event) => {
		log.info('inline edit focused')

		const hideTimer = _.get(this,'state.hideTimer')
		if (hideTimer)
			this.props.clearTimeout(hideTimer)

		this.setState({focused:true,hideTimer:void 0})


	}

	onKeyDown = (event:React.KeyboardEvent) => {
		if (event.keyCode === 13) {
			const {labelField,textField} = this.state,
				labelFieldInputElem = $('input',ReactDOM.findDOMNode(labelField)),
				textFieldInputElem = $('input',ReactDOM.findDOMNode(textField))

			if (labelFieldInputElem && event.currentTarget === textFieldInputElem[0]) {
				labelFieldInputElem.focus()
			} else {
				this.save()
			}

			event.preventDefault()
			event.stopPropagation()
			return false
		}
	}




	/**
	 * Make repo items
	 *
	 * @returns {any}
	 */
	makeRepoMenuItems() {
		const
			{props,state} = this,
			{
				issue,
				styles,
				availableRepos,
				theme,
				fromIssue,
				saveError,
				labels,
				saving,
				repo
			} = props


		const makeRepoLabel = (availRepoItem) => (
			<div style={styles.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				{repoName(availRepoItem.repo, styles.form.repo.item.label)}
			</div>
		)

		return availableRepos.map(availRepoItem => (
			<MenuItem key={availRepoItem.repoId}
			          className='issueEditDialogFormMenuItem'
			          value={availRepoItem.repoId}
			          style={styles.menuItem}
			          primaryText={makeRepoLabel(availRepoItem)}
			/>
		))
	}



	makeMilestoneItems() {
		const {issue,milestones,styles} = this.props

		const items = [<MenuItem key='empty-milestones'
		                         className='issueEditDialogFormMenuItem'
		                         style={styles.menuItem}
		                         value={null}
		                         primaryText={<div style={styles.form.milestone.item}>
								<Icon iconSet='octicon' iconName='milestone'/>
								<div style={styles.form.milestone.item.label}>No milestones</div>
							</div>}/>]

		if (!milestones.length) {
			return items
		}

		const makeMilestoneLabel = (milestone:Milestone) => (
			<div style={styles.form.milestone.item}>
				<Icon iconSet='octicon' iconName='milestone'/>
				<div style={styles.form.milestone.item.label}>
					{milestone.title}
				</div>
			</div>
		)

		return items.concat(milestones
			.filter(milestone => milestone.repoId === issue.repoId)
			.map(milestone => <MenuItem key={milestone.url}
			          className='issueEditDialogFormMenuItem'
			          value={milestone.url}
			          style={styles.menuItem}
			          primaryText={makeMilestoneLabel(milestone)}/>
			))
	}


	render() {
		const
			{props,state} = this,
			{repo,issue,styles,theme,fromIssue,saveError,labels,saving} = props


		if (!issue)
			return <div/>

		const
			issueStyles = makeStyle(
				styles.issue,
				styles.issue.selected
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				styles.issueTitleSelected
			),
			selectProps = {
				style:makeStyle(styles.form.repo,styles.menu),
				inputStyle:makeStyle(styles.input,{height:30}),
				labelStyle:makeStyle(styles.menu,{paddingRight:34}),
				iconStyle:makeStyle(styles.menu,{top: 0}),

				underlineStyle:styles.input.underlineDisabled,
				underlineDisabledStyle:styles.input.underlineDisabled,
				underlineFocusStyle:styles.input.underlineFocus,
				menuListStyle:makeStyle(styles.select.list),
				menuStyle:makeStyle(styles.menu,styles.form.repo.menu),
				underlineShow:false,
				autoWidth:true,
				fullWidth:false
			}

		const titleError = getGithubErrorText(saveError,'title') || _.get(saveError,'message')

		return <HotKeys
					{...filterProps(props)}
					style={issueStyles}
					handlers={this.keyHandlers}
					onBlur={this.onBlur}
					onFocus={this.onFocus}
		            className={'animated fadeIn selected'}>

			{/*<div style={styles.issueMarkers}></div>*/}
			<div style={makeStyle(styles.root,saving && {opacity:0,pointerEvents:'none'})}>

				<div style={styles.row}>
					{/* REPO */}
					<SelectField
						{...selectProps}
						value={issue.repoId}
					    onChange={this.onRepoChange}

					>

						{this.makeRepoMenuItems()}
					</SelectField>

					{/*<div style={makeStyle(styles.issueRepo,theme.issuesPanel.issueRepo)}>*/}
						{/*{repoName(repo)}*/}
					{/*</div>*/}
				</div>


				<div style={styles.row}>
					{/*<div style={issueTitleStyle}>{issue.title}</div>*/}
					{/*<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>*/}
					<TextField ref={this.setTextField}
					           defaultValue={issue.title}
					           onChange={this.onTitleChange}
					           onKeyDown={this.onKeyDown}
					           errorStyle={{transform: 'translate(0,0.5rem)'}}
					           errorText={titleError}
					           hintText="title..."
					           hintStyle={styles.input.hint}
					           style={makeStyle(
					           	    styles.form.title,
					           	    titleError && {
					           	        marginBottom: 15
				                    }
					           )}
					           inputStyle={styles.input}
					           underlineShow={false}
					           fullWidth={true}
					           tabIndex={1}
					           autoFocus/>
				</div>

				<div>

					{/* LABELS */}
					{/*<IssueLabelsAndMilestones*/}
						{/*showIcon*/}
						{/*labels={labels}*/}
						{/*milestones={issue.milestone ? [issue.milestone] : []}*/}
						{/*style={styles.issueLabels}*/}
						{/*labelStyle={styles.issue.labels.label}*/}
					{/*/>*/}
					{/*style={{backgroundColor:styles.input.backgroundColor}}*/}
					<LabelFieldEditor labels={issue.labels || []}
					                  ref={this.setLabelFieldRef}
					                  onKeyDown={this.onKeyDown}
					                  id="issueEditInlineLabels"
					                  hint="labels..."
					                  hintAlways={true}
					                  hintStyle={makeStyle(styles.input.hint,{
					                  	bottom: 5
					                  })}
					                  inputStyle={makeStyle(styles.input,{
					                  	margin: "2rem 0 0 0",
					                  	height: "3.8rem"
					                  })}
					                  tabIndex={2}
					                  underlineShow={false}
					                  availableLabels={labels}
					                  onLabelsChanged={this.onLabelsChanged}
					                  />

				</div>
				<div style={styles.row}>
					{/* MILESTONE */}
					<SelectField
						{...selectProps}
						value={_.get(issue.milestone,'url',null)}
						onChange={this.onMilestoneChange}
					>

						{this.makeMilestoneItems()}
					</SelectField>
					<div style={styles.row.spacer} />

					<Button style={styles.row.action}
					        mode='raised'
					        onClick={this.save}>
						<Icon style={styles.row.action.icon}
						      iconSet='material-icons'>
							save
						</Icon>
						<div style={styles.row.action.label}>save</div>
					</Button>
				</div>
				{/* Saving progress indicator */}

			</div>
			<div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
				<CircularProgress
					color={theme.progressIndicatorColor}
					size={1} />
			</div>
		</HotKeys>
	}

}