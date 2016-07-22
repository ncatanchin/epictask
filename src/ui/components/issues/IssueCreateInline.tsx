/**
 * Created by jglanz on 7/21/16.
 */

// Imports
import * as React from 'react'
import {PureRender, Avatar, LabelFieldEditor, Icon} from 'components/common'
import {Issue} from 'models/Issue'
import {Label} from 'models/Label'
import {Milestone} from 'models/Milestone'
import filterProps from 'react-valid-props'
import {repoName, getGithubErrorText} from 'ui/components/common/Renderers'
import {IssueLabelsAndMilestones} from 'components/issues'
import {TextField} from 'material-ui'
import {ThemedStyles} from 'shared/themes/ThemeManager'
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
	root: [FlexColumn, FlexAuto, {}],
	savingIndicator: [PositionAbsolute,FlexColumnCenter,Fill,makeAbsolute(),{
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

	form: makeStyle({

		title: [{
			flex: '1 0 50%',
			padding: "0",
		}],

		repo: [FlexScale, {
			//height: 30,
			width: 'auto',
			lineHeight: rem(3),
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
//endregion


/**
 * IIssueCreateInlineProps
 */
export interface IIssueCreateInlineProps extends React.HTMLAttributes {
	styles?: any
	theme?: any
	saveError?:Error
	saving?:boolean
	fromIssue?:Issue
	labels?:Label[]
	repoModels?:Map<string,Repo>
	milestones?:Milestone[]
	setTimeout?:Function
	clearTimeout?:Function
	availableRepos?:AvailableRepo[]

}

/**
 * IIssueCreateInlineState
 */
export interface IIssueCreateInlineState {
	issue?:Issue
	repo?:Repo
	textField?:any
	focused?:boolean
	hideTimer?:any

}

/**
 * IssueCreateInline
 *
 * @class IssueCreateInline
 * @constructor
 **/

@connect(createStructuredSelector({
	repoModels: repoModelsSelector,
	fromIssue: editingIssueSelector,
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
export class IssueCreateInline extends React.Component<IIssueCreateInlineProps,IIssueCreateInlineState> {

	issueActions = Container.get(IssueActionFactory)
	uiActions = Container.get(UIActionFactory)

	private getNewState = (props) => {
		const issue = _.get(this, 'state.issue', props.fromIssue)
		return {
			issue,
			repo: props.repoModels.get(`${issue.repoId}`)
		}
	}

	private updateState = (props) => this.setState(this.getNewState(props))


	/**
	 * Component mount
	 */
	componentWillMount = () => this.updateState(this.props)


	/**
	 * Component props changed
	 *
	 * @param newProps
	 */
	componentWillReceiveProps = (newProps) => this.updateState(newProps)


	/**
	 * Title input changed
	 *
	 */
	onTitleChange = (event,title) => this.setState({
		issue:assign(_.clone(this.state.issue),{
			title
		})
	})


	/**
	 * Key handlers
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			this.hide()
			this.uiActions.focusIssuesPanel()
		}
	}

	onRepoChange = (event, index, repoId) => {
		const
			{issue} = this.state,
			{milestones} = this.props

		this.setState({issue:assign(_.clone(issue),{
			milestone:null,
			labels:[],
			repoId
		})})
		//this.issueActions.setEditingIssue(editingIssue)
	}

	onMilestoneChange = (event, index, value) => {
		const
			{issue} = this.state,
			{milestones} = this.props

		const milestone = milestones.find(item => item.url === value)
		this.setState({issue:assign(_.clone(issue),{milestone})})
		//this.updateIssueState({milestone})

	}

	onAssigneeChange = (event, index, value) => {
		// const {editingIssue} = this.props
		// const assignee = !editingIssue || !editingIssue.collaborators ? null :
		// 	editingIssue.collaborators.find(item => item.login === value)

		//this.updateIssueState({assignee})
	}

	hide = () => {
		this.issueActions.setEditingInline(false)
	}

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

	onFocus = (event) => {
		log.info('inline edit focused')

		const hideTimer = _.get(this,'state.hideTimer')
		if (hideTimer)
			this.props.clearTimeout(hideTimer)

		this.setState({focused:true,hideTimer:void 0})


	}



	onLabelsChanged = (labels:Label[]) => {
		const {issue} = this.state

		this.setState({issue:assign(_.clone(issue),{labels})})


	}

	setTextField = (textField) => {
		if (textField)
			textField.focus()

		this.setState({textField})
	}


	makeRepoMenuItems() {
		const
			{props,state} = this,
			{styles,availableRepos,theme,fromIssue,saveError,labels,saving} = props,
			{issue,repo} = state

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

	render() {
		const
			{props,state} = this,
			{styles,theme,fromIssue,saveError,labels,saving} = props,
			{issue,repo} = state

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
			)

		return <HotKeys
					{...filterProps(props)}
					style={issueStyles}
					handlers={this.keyHandlers}
					onBlur={this.onBlur}
					onFocus={this.onFocus}
		            className={'animated fadeIn selected'}>

			{/*<div style={styles.issueMarkers}></div>*/}
			{/*<div style={styles.root}>*/}



				<div style={styles.issue.repo}>
					{/* REPO */}
					<SelectField value={issue.repoId}
					             style={makeStyle(styles.form.repo,styles.menu)}

					             inputStyle={makeStyle(styles.input,{height:30})}
					             labelStyle={makeStyle(styles.menu,{paddingRight:34})}
					             iconStyle={makeStyle(styles.menu,{top: 0})}
					             onChange={this.onRepoChange}
					             underlineStyle={styles.input.underlineDisabled}
					             underlineDisabledStyle={styles.input.underlineDisabled}
					             underlineFocusStyle={styles.input.underlineFocus}
					             menuListStyle={makeStyle(styles.select.list)}
					             menuStyle={makeStyle(styles.menu,styles.form.repo.menu)}
					             underlineShow={false}
					             autoWidth={true}
					             fullWidth={false}>

						{this.makeRepoMenuItems()}
					</SelectField>

					{/*<div style={makeStyle(styles.issueRepo,theme.issuesPanel.issueRepo)}>*/}
						{/*{repoName(repo)}*/}
					{/*</div>*/}
				</div>


				<div style={styles.issueTitleRow}>
					{/*<div style={issueTitleStyle}>{issue.title}</div>*/}
					{/*<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>*/}
					<TextField ref={this.setTextField}
					           value={issue.title}
					           onChange={this.onTitleChange}
					           errorStyle={{transform: 'translate(0,1rem)'}}
					           errorText={getGithubErrorText(saveError,'title')}
					           hintText="title..."
					           hintStyle={styles.input.hint}
					           style={styles.form.title}
					           inputStyle={styles.input}
					           underlineShow={false}
					           fullWidth={true}
					           autoFocus/>
				</div>

				<div style={styles.issueBottomRow}>

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
					                  id="issueEditInlineLabels"
					                  hint="Labels..."
					                  hintAlways={true}
					                  inputStyle={makeStyle(styles.input,{
					                  	//backgroundColor:'transparent',
					                  	//padding: 0,
					                  	margin: "2rem 0 0 0",
					                  	height: "3.8rem"
					                  })}

					                  underlineShow={false}
					                  availableLabels={labels}
					                  onLabelsChanged={this.onLabelsChanged}
					                  hintStyle={styles.input.hint}
					                  />

				</div>
			{/*</div>*/}
		</HotKeys>
	}

}