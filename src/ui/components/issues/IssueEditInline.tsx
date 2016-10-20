/**
 * Created by jglanz on 7/21/16.
 */

// Imports
import * as React from 'react'
import {PureRender, LabelFieldEditor, Icon, Button} from 'ui/components/common'
import {List} from 'immutable'
import {Issue} from 'shared/models/Issue'
import {Label} from 'shared/models/Label'
import {Milestone} from 'shared/models/Milestone'
import {Repo} from 'shared/models/Repo'
import filterProps from 'react-valid-props'
import {RepoName, getGithubErrorText} from 'ui/components/common/Renderers'
import {TextField} from 'material-ui'
import {ThemedStyles, makeThemeFontSize} from 'shared/themes/ThemeManager'

import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {
	editingIssueSelector,
	issueStateSelector, issueSaveErrorSelector, issueSavingSelector
} from 'shared/actions/issue/IssueSelectors'
import {CircularProgress} from 'material-ui'


import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {Container} from 'typescript-ioc'
import {CommonKeys} from 'shared/KeyMaps'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import Radium = require('radium')
import {AvailableRepo} from 'shared/models/AvailableRepo'
import {MenuItem} from 'material-ui'
import {SelectField} from 'material-ui'
import {
	enabledRepoIdsSelector, availableReposSelector,
	enabledAssigneesSelector, enabledLabelsSelector, enabledMilestonesSelector
} from "shared/actions/repo/RepoSelectors"
import { User } from "shared/models"
import { cloneObject } from "shared/util"
import {
	CommandComponent, getCommandProps, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { ICommand } from "shared/commands/Command"
import { ContainerNames } from "shared/config/CommandContainerConfig"

// Constants
const log = getLogger(__filename)
const ReactTimeout = require('react-timeout')

//region Styles
const baseStyles = (topStyles,theme,palette) => ({
	root: [FlexColumn,FillWidth,FlexAuto,makeTransition('opacity')],
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
				flexWrap: 'wrap',
				label: {
					margin: '0.5rem 0.7rem 0rem 0',
				}

			}],
			repo: [FlexRow, makeFlexAlign('flex-start', 'flex-start'), {
				text: [{

				}]
			}]
		}
	],

	input: {
		height: 38,
		fontWeight: 300,
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

		repo: [{
			flexShrink: 1,
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
export interface IIssueEditInlineProps extends React.HTMLAttributes<any> {
	styles?: any
	theme?: any
	saveError?:Error
	saving?:boolean
	editingIssue?:Issue
	setTimeout?:Function
	clearTimeout?:Function
	availableRepos?:List<AvailableRepo>
	milestones?:List<Milestone>
	labels?:List<Label>
	assignees?:List<User>

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
	editingIssue: editingIssueSelector,
	availableRepos: availableReposSelector,
	milestones: enabledMilestonesSelector,
	labels: enabledLabelsSelector,
	assignees: enabledAssigneesSelector,
	saving: issueSavingSelector,
	saveError: issueSaveErrorSelector
}))
@ThemedStyles(baseStyles,'inline','issueEditDialog','form')
@CommandComponent()
@ReactTimeout
export class IssueEditInline extends React.Component<IIssueEditInlineProps,IIssueEditInlineState> implements ICommandComponent {


	commandItems = (builder:CommandContainerBuilder) =>
		builder.make()
	
	readonly commandComponentId:string = 'IssueEditInline'
	
	
	issueActions = Container.get(IssueActionFactory)
	uiActions = Container.get(UIActionFactory)

	private get issue():Issue {
		return this.props.editingIssue
	}


	/**
	 * Key handlers
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			this.hide()
			getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
		},
		[CommonKeys.Delete]: () => {},
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
		const
			{editingIssue} = this.props


		this.issueActions.setEditingIssue(cloneObject(editingIssue,{
			milestone:null,
			labels:[],
			repoId
		}),true)
	}

	/**
	 * Selected milestone changed
	 *
	 * @param event
	 * @param index
	 * @param value
	 */
	onMilestoneChange = (event, index, value) => {

		const
			{milestones,editingIssue} = this.props,

			milestone = milestones.find(item => item.id === value),
			newIssue = cloneObject(editingIssue,{
				milestone
			})
		
		log.info('Milestone set issue=',editingIssue,'milestone',milestone,'value',value,'milestones',milestones,'newIssue',newIssue)
		
		this.issueActions.setEditingIssue(newIssue,true)
		

	}


	onAssigneeChange = (event, index, value) => {
		const
			{assignees,editingIssue} = this.props,
			assignee = assignees.find(it => it.id === value)
			
		this.issueActions.setEditingIssue(cloneObject(editingIssue,{assignee}))
		// const assignee = !editingIssue || !editingIssue.collaborators ? null :
		// 	editingIssue.collaborators.find(item => item.login === value)

		//this.updateIssueState({assignee})
	}

	onLabelsChanged = (labels:Label[]) => {
		const
			{issue} = this,
			newIssue = cloneObject(issue,{labels})
		
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
		this.issueActions.issueSave(cloneObject(this.issue))
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

	onKeyDown = (event:React.KeyboardEvent<any>) => {
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
			{props,state,issue} = this,
			{
				styles,
				availableRepos,
				theme,
				saveError,
				labels,
				saving
			} = props


		const makeRepoLabel = (availRepoItem) => (
			<div style={styles.form.repo.item}>
				<Icon iconSet='octicon' iconName='repo'/>
				<RepoName repo={availRepoItem.repo} style={styles.form.repo.item.label}/>
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
		let
			{issue} = this,
			{milestones,styles} = this.props

		const
			items = [
				<MenuItem key='empty-milestones'
                       className='issueEditDialogFormMenuItem'
                       style={styles.menuItem}
                       value={null}
                       primaryText={<div style={styles.form.milestone.item}>
					<Icon iconSet='octicon' iconName='milestone'/>
					<div style={styles.form.milestone.item.label}>No milestones</div>
				</div>}/>
			]

		if (!milestones.size) {
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

		//milestones = _.uniqBy(milestones,'id')
		log.info('using milestones',milestones)
		
		const
			milestoneItems = milestones
				.filter(milestone => milestone.repoId === issue.repoId)
				.map(milestone => <MenuItem key={milestone.url}
				                            className='issueEditDialogFormMenuItem'
				                            value={milestone.url}
				                            style={styles.menuItem}
				                            primaryText={makeMilestoneLabel(milestone)}/>
				).toArray()
		
		return items.concat(milestoneItems)
	}


	render() {
		const
			{issue,props,state} = this,
			{styles,theme,style,saveError,labels,saving} = props


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
				style:makeStyle(styles.form.repo,styles.menu,{marginRight:rem(1),flexShrink:0.5}),
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

		return <CommandRoot
					{...filterProps(props)}
					component={this}
					style={makeStyle(issueStyles,style)}
					className={'selected'}>

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
					        mode='flat'
					        onClick={this.hide}>
						<Icon style={[styles.row.action.icon,{padding: rem(0.1)}]}
						      iconSet='material-icons'>
							close
						</Icon>
					</Button>
					<Button style={styles.row.action}
					        mode='flat'
					        onClick={this.save}>
						<Icon style={[styles.row.action.icon,{padding: rem(0.1)}]}
						      iconSet='material-icons'>
							save
						</Icon>
					</Button>
				</div>


				<div style={styles.row}>
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


					<LabelFieldEditor labels={issue.labels || []}
					                  ref={this.setLabelFieldRef}
					                  onKeyDown={this.onKeyDown}
					                  id="issueEditInlineLabels"
					                  mode="fixed-scroll-x"
					                  hint="labels..."
					                  hintAlways={true}
					                  hintStyle={makeStyle(styles.input.hint,{bottom: 5})}
					                  inputStyle={makeStyle(styles.input,{
					                  	margin: "2rem 0 0 0",
					                  	height: "3.8rem"
					                  })}
					                  tabIndex={2}
					                  underlineShow={false}
					                  availableLabels={labels.filter(label => label.repoId === issue.repoId).toArray()}
					                  onLabelsChanged={this.onLabelsChanged}
					                  />

				</div>
				{/*<div style={styles.row}>*/}
					{/**/}
					{/*<div style={styles.row.spacer} />*/}
				
					{/*<Button style={styles.row.action}*/}
					        {/*mode='raised'*/}
					        {/*onClick={this.save}>*/}
						{/*<Icon style={styles.row.action.icon}*/}
						      {/*iconSet='material-icons'>*/}
							{/*save*/}
						{/*</Icon>*/}
						{/*<div style={styles.row.action.label}>save</div>*/}
					{/*</Button>*/}
				{/*</div>*/}
				{/* Saving progress indicator */}

			</div>
			<div style={makeStyle(styles.savingIndicator,saving && {opacity: 1})}>
				<CircularProgress
					color={theme.progressIndicatorColor}
					size={1} />
			</div>
		</CommandRoot>
	}

}