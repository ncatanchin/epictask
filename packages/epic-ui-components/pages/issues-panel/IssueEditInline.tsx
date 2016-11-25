/**
 * Created by jglanz on 7/21/16.
 */
// Imports
import {FormEvent} from "react"
import { TextField ,Icon, Button, RepoLabel, getGithubErrorText } from "epic-ui-components"

import { LabelFieldEditor } from "epic-ui-components/fields/LabelFieldEditor"
import { List } from "immutable"
import { Issue, Label, Milestone, AvailableRepo, User, IIssueListItem } from "epic-models"
import filterProps from "react-valid-props"
 
import { ThemedStyles, makeThemeFontSize, IThemedAttributes } from "epic-styles"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import {
	availableReposSelector,
	enabledAssigneesSelector,
	enabledLabelsSelector,
	enabledMilestonesSelector
} from "epic-typedux"
import { CommonKeys, getCommandManager, ContainerNames } from "epic-command-manager"
import { CommandComponent, ICommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { getUIActions, getIssueActions } from "epic-typedux/provider"
import { cloneObjectShallow, cloneObject, shallowEquals, addErrorMessage } from "epic-global"
import { IRowState, MilestoneLabel, SaveIndicator } from "epic-ui-components/common"
import { getValue, isNumber } from "typeguard"
import { IssuesPanel, IssuesPanelController, getIssuesPanelSelector } from "epic-ui-components/pages/issues-panel"
import { MilestoneSelect } from "epic-ui-components/fields"
import {
	FlexAuto, makePaddingRem, makeStyle, FlexScale, Ellipsis, colorAlpha, FlexRowCenter,
	FillWidth, OverflowHidden, rem, FlexColumnCenter, FlexColumn, makeTransition, PositionRelative
} from "epic-styles/styles"



// Constants
const
	log = getLogger(__filename)

//region Styles
const baseStyles = (topStyles, theme, palette) => {
	const
		{ text, accent, primary, background, secondary } = palette
	
	return [
		OverflowHidden,
		FlexColumn,
		FillWidth,
		FlexAuto,
		makeTransition('opacity'),
		
		{
			
			backgroundColor: background,
			
		
			issue: [
				FillWidth,
				PositionRelative,
				makeTransition([ 'background-color' ]), {
					// COLORS
					backgroundColor: background,
					color: text.secondary,
					borderBottom: '0.1rem solid ' + colorAlpha(text.secondary, 0.1),
						
					cursor: 'pointer',
					
					// Issue selected
					selected: [],
					
					// Avatar component
					avatar: [ {
					} ],
					
					
				}
			],
			
			
			row: [ FlexRowCenter, FillWidth, OverflowHidden, {
				
				spacer: [ FlexScale ],
				
				action: [ FlexRowCenter, FlexAuto, {
					borderRadius: 0,
					height: rem(3),
					icon: [ FlexAuto, FlexColumnCenter, makePaddingRem(0.3,1,0.3,0), {
						fontSize: makeThemeFontSize(1.3)
					} ],
					label: [ FlexAuto, FlexColumnCenter ]
				} ]
			} ]
		}
	]
}
//endregion


/**
 * IIssueEditInlineProps
 */
export interface IIssueEditInlineProps extends IThemedAttributes {
	
	
	editingIssue?:Issue
	
	
	availableRepos?:List<AvailableRepo>
	
	viewController?:IssuesPanelController
	
	rowState?:IRowState<string,string,number>
	items?:List<IIssueListItem<any>>
}

/**
 * IIssueEditInlineState
 */
export interface IIssueEditInlineState {
	textField?:any
	focused?:boolean
	labelField?:any
	
	saving?:boolean
	error?:Error
	
	realIndex?:number
	item?:IIssueListItem<any>
}

/**
 * IssueCreateInline
 *
 * @class IssueEditInline
 * @constructor
 **/


@connect(() => createStructuredSelector({
	editingIssue: getIssuesPanelSelector(selectors => selectors.editingIssueSelector),
	availableRepos: availableReposSelector,
	items: getIssuesPanelSelector(selectors => selectors.issueItemsSelector)
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'inline', 'issueEditDialog', 'form')
export class IssueEditInline extends React.Component<IIssueEditInlineProps,IIssueEditInlineState> implements ICommandComponent {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder.make()
	
	readonly commandComponentId:string = 'IssueEditInline'
	
	issueActions = getIssueActions()
	
	uiActions = getUIActions()
	
	/**
	 * Check for changes to editing issue
	 *
	 * @param nextProps
	 * @param nextState
	 *
	 * @returns {boolean}
	 */
	shouldComponentUpdate = (nextProps, nextState) => {
		return !shallowEquals(this.props, nextProps, 'editingIssue', 'styles', 'theme', 'palette') || !shallowEquals(this.state, nextState)
	}
	
	/**
	 * Get issues panel from context
	 *
	 * @returns {IssuesPanel}
	 */
	private get controller() {
		return this.props.viewController
	}
	
	
	updateState = (props = this.props) => {
		const
			{ items, rowState } = props,
			realIndex:number = rowState.item,
			item = isNumber(realIndex) && items.get(realIndex)
		
		this.setState({
			item,
			realIndex
		})
	}
	
	/**
	 * On mount update state
	 *
	 * @type {(props?:any)=>any}
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props update state
	 */
	componentWillReceiveProps = this.updateState
	
	
	/**
	 * Internal issue accessor
	 *
	 * @returns {Issue}
	 */
	private get issue():Issue {
		return this.props.editingIssue
	}
	

	
	/**
	 * Title input changed
	 *
	 */
	onTitleChange = (event:FormEvent<HTMLInputElement>) => {
		this.controller.setEditingIssue(
			cloneObjectShallow(this.issue, {
				title: event.currentTarget.value
			})
		)
	}
	
	/**
	 * Selected repo changed
	 *
	 * @param event
	 * @param index
	 * @param repoId
	 */
	onRepoChange = (event, index, repoId) => {
		const
			{ editingIssue } = this.props
		
		
		this.controller.setEditingIssue(cloneObjectShallow(editingIssue, {
			milestone: null,
			labels: [],
			repoId
		}))
	}
	
	/**
	 * Selected milestone changed
	 *
	 * @param milestone
	 */
	onMilestoneChange = (milestone:Milestone) => {
		
		const
			{ issue } = this,
			newIssue = cloneObjectShallow(issue, {
				milestone
			})
		
		log.info('Milestone set issue=', issue, 'milestone', milestone, 'updated issue', newIssue)
		
		this.controller.setEditingIssue(newIssue)
		
	}
	
	
	setTextField = (textField) => {
		if (textField)
			this.setState({ textField })
	}
	
	/**
	 * Set saving flag
	 *
	 * @param saving
	 */
	setSaving = (saving:boolean) => this.setState({ saving })
	
	/**
	 * Hide the editor field
	 */
	
	hide = () => {
		this.controller.setEditingInline(false)
	}
	
	/**
	 * Save the issue
	 */
	save = async() => {
		this.setSaving(true)
		try {
			await getIssueActions().saveIssue(cloneObject(this.issue))
			this.hide()
		} catch (error) {
			log.error(`Failed to save inline issue`, error)
			this.setState({ error })
			addErrorMessage(`Unable to save issue: ${error.message}`)
		} finally {
			this.setSaving(false)
		}
	}
	
	/**
	 * When blurred, hide after delay in case another field is selected
	 * in inline form
	 *
	 * @param event
	 *
	 */
	onBlur = (event) => {
		log.info('Inline edit blurred', document.activeElement)
		
		// if (ReactDOM.findDOMNode(this).contains(document.activeElement) || document.activeElement === document.body) {
		// 	log.info('we still have focus, probably clicked another window')
		// 	return
		// }
		if (!this.state.saving)
			this.hide()
		
		// this.setState({
		// 	focused: false,
		// }, this.hide)
		
	}
	
	/**
	 * on focus event
	 *
	 * @param event
	 */
	onFocus = (event) => {
		log.info('inline edit focused')
	}
	
	/**
	 * Watch for the enter key
	 *
	 * @param event
	 * @returns {boolean}
	 */
	onKeyDown = (event:React.KeyboardEvent<any>) => {
		if (event.keyCode === 13) {
			this.save()
			
			event.preventDefault()
			event.stopPropagation()
			return false
		}
	}
	
	
	render() {
		const
			{ issue, props, state } = this,
			{ styles, style, availableRepos } = props,
			{ saving, error } = state,
			availRepo = issue && availableRepos && availableRepos.find(it => it.id === issue.repoId),
			repo = availRepo && availRepo.repo
		
		
		if (!issue)
			return <div/>
		
		const
			issueStyles = makeStyle(
				styles.issue,
				styles.issue.selected
			),
			
			// ERROR
			titleError = getValue(
				() => getGithubErrorText(error, 'title'),
				getValue(() => error.message)
			)
		
		return <CommandRoot
			{...filterProps(props)}
			component={this}
			style={makeStyle(issueStyles,style)}
			className={'selected'}>
			
			{/*<div style={styles.issueMarkers}></div>*/}
			{!saving && <div style={ styles}>
				
				{/* REPO -> MILESTONE -> ACTIONS */}
				<div style={makeStyle(styles.row, makePaddingRem(0,0,0,1))}>
					<RepoLabel repo={repo} style={FlexScale} textStyle={Ellipsis}/>
					
					<div style={styles.row.spacer}/>
					
					{/* MILESTONE */}
					<MilestoneLabel
						style={makeStyle(makePaddingRem(0,1,0,0.7),FlexAuto)}
						milestone={issue.milestone}/>
					
					
					{/* ACTIONS */}
					<Button style={styles.row.action}
					        mode='flat'
					        onClick={this.hide}>
						<Icon style={[styles.row.action.icon,makePaddingRem(0.1)]}
						      iconSet='material-icons'>
							close
						</Icon>
					</Button>
					<Button style={styles.row.action}
					        mode='flat'
					        onClick={this.save}>
						<Icon style={[styles.row.action.icon,makePaddingRem(0.1)]}
						      iconSet='material-icons'>
							save
						</Icon>
					</Button>
				</div>
				
				{/* ISSUE TITLE */}
				<div style={[styles.row,makePaddingRem(0.5,0)]}>
					<TextField
						ref={this.setTextField}
						defaultValue={issue.title}
						placeholder="title"
						onChange={this.onTitleChange}
						onBlur={this.onBlur}
						onKeyDown={this.onKeyDown}
						style={FlexScale}
						inputStyle={FlexScale}
						error={titleError}
					  autoFocus
					  tabIndex={1}
					/>
					
				</div>
			</div>}
			{/* Saving progress indicator */}
			<SaveIndicator open={saving}/>
		</CommandRoot>
	}
	
}