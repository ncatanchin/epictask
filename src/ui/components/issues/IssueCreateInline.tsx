/**
 * Created by jglanz on 7/21/16.
 */

// Imports
import * as React from 'react'
import {PureRender, Avatar, LabelFieldEditor} from 'components/common'
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

// Constants
const log = getLogger(__filename)

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
		FlexRow,
		FlexAuto,
		FillWidth,
		FlexAlignStart,
		makeTransition(['background-color']), {

			padding: '1.5rem 1rem 1.5rem 1rem',
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
			repo: [FlexRow, makeFlexAlign('stretch', 'center'), {
				pointerEvents: 'none',

				text: [{

				}]
			}]
		}
	],

	input: {
		fontWeight: 700
	},

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
 * IIssueCreateInlineProps
 */
export interface IIssueCreateInlineProps extends React.HTMLAttributes {
	styles?: any
	theme?: any
	saveError:Error
	saving:boolean
	fromIssue:Issue
	labels:Label[],
	repoModels?:Map<string,Repo>
	milestones:Milestone[]
}

/**
 * IIssueCreateInlineState
 */
export interface IIssueCreateInlineState {
	issue?:Issue
	repo?:Repo
}

/**
 * IssueCreateInline
 *
 * @class IssueCreateInline
 * @constructor
 **/

@connect(createStructuredSelector({
	repoModels: repoModelsSelector
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'dialog','issueEditDialog','form')
@PureRender
export class IssueCreateInline extends React.Component<IIssueCreateInlineProps,IIssueCreateInlineState> {


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

	onLabelsChanged = (labels:Label[]) => {
		const {issue} = this.state

		this.setState({issue:assign(_.clone(issue),{labels})})


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

		return <div {...filterProps(props)} style={issueStyles}
		                                    className={'animated fadeIn selected'}>

			{/*<div style={styles.issueMarkers}></div>*/}
			<div style={styles.issueDetails}>

				<div style={styles.issue.repo}>
					<div style={makeStyle(styles.issueRepo,theme.issuesPanel.issueRepo)}>
						{repoName(repo)}
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.issue.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.issueTitleRow}>
					{/*<div style={issueTitleStyle}>{issue.title}</div>*/}
					{/*<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>*/}
					<TextField value={issue.title}
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

				<div style={styles.issueBottomRow}>

					{/* LABELS */}
					{/*<IssueLabelsAndMilestones*/}
						{/*showIcon*/}
						{/*labels={labels}*/}
						{/*milestones={issue.milestone ? [issue.milestone] : []}*/}
						{/*style={styles.issueLabels}*/}
						{/*labelStyle={styles.issue.labels.label}*/}
					{/*/>*/}
					<LabelFieldEditor labels={issue.labels || []}
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

				</div>
			</div>
		</div>
	}

}