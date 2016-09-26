/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import { List } from 'immutable'
import * as moment from 'moment'
import * as React from 'react'
import { Style } from 'radium'
import { connect } from 'react-redux'
import { createStructuredSelector } from 'reselect'
import { Avatar, PureRender, Renderers } from 'ui/components/common'

import { Issue } from 'shared/models/Issue'
import { Comment } from 'shared/models/Comment'
import { IssueLabelsAndMilestones } from 'ui/components/issues'
import { IssueActivityText } from './IssueActivityText'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import {
	selectedIssueIdsSelector, issuesSelector, selectedIssueSelector, activitySelector
} from 'shared/actions/issue/IssueSelectors'
import { Milestone } from 'shared/models/Milestone'
import { Label } from 'shared/models/Label'
import { IssueActionFactory } from 'shared/actions/issue/IssueActionFactory'
import { Container } from 'typescript-ioc'
import { canEditIssue, canAssignIssue } from 'shared/Permission'
//import {Button, Icon} from 'epictask/ui/components/common'

import baseStyles from './IssueDetailPanel.styles'
import { VisibleList } from "ui/components/common/VisibleList"
import { TIssueActivity } from "shared/actions/issue/IssueState"
import {
	IssuesEvent, TIssueEventGroupType, isComment,
	isIssue, getEventGroupType, User
} from "shared/models"
import { shallowEquals } from "shared/util/ObjectUtil"
import LabelChip from "ui/components/common/LabelChip"
import { EventGroup, isEventGroup } from "ui/components/issues/IssueEventGroup"
import {
	CommandComponent, ICommandComponentProps, ICommandComponent,
	getCommandProps
} from "shared/commands/CommandComponent"
import { ICommand } from "shared/commands/Command"



// Other stuff
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)


type TDetailItem = Comment|EventGroup|Issue



/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps extends ICommandComponentProps {
	selectedIssueIds?:number[]
	selectedIssue?:Issue
	issues?:List<Issue>
	activity?:TIssueActivity
	theme?:any
	styles?:any
}

export interface IIssueDetailPanelState {
	items:List<TDetailItem>
}

/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/


@connect(createStructuredSelector({
	selectedIssueIds: selectedIssueIdsSelector,
	selectedIssue: selectedIssueSelector,
	issues: issuesSelector,
	activity: activitySelector
}))
@ThemedStyles(baseStyles, 'issueDetail')
@CommandComponent()
@PureRender
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,IIssueDetailPanelState> implements  ICommandComponent {
	
	refs:{[name:string]:any}
	
	readonly commands:ICommand[] = []
	
	get commandComponentId():string {
		return 'IssueDetailPanel'
	}
	
	/**
	 * Update the state when props change
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{activity:currentActivity,selectedIssue:currentSelectedIssue} = this.props,
			{activity} = props,
			{events,comments,selectedIssue} = activity
		
		let
			items:List<TDetailItem> = this.state && this.state.items
		
		// CHECK CHANGES OR FIRST LOAD
		const
			itemsChanged = !items || !shallowEquals(selectedIssue,currentSelectedIssue,'updated_at') || !shallowEquals(currentActivity,activity,'events','comments')
		
		// IF NO CHANGES THEN RETURN
		if (!itemsChanged) {
			log.info(`Items did not change in issue details`)
			return
		}
		
		
		// CREATE NEW ITEMS
		items = List<TDetailItem>()
		
		// NO SELECTED ISSUE = NO ACTIVITY
		if (selectedIssue) {
			
			// COMBINE ALL ACTIVITY
			const
				eventsAndComments = List<IssuesEvent|Comment>().concat(
					events.filter(event => getEventGroupType(event) !== 'none'),
					comments
				).sortBy(o => o.created_at)
			
			
			// FILL ITEMS WITH ACTIVITY
			items = items.withMutations(newItems => {
				newItems.push(selectedIssue)
				
				// ITERATE COMMENTS AND EVENTS ADDING ALL
				eventsAndComments.reduce((eventGroup:EventGroup,eventOrComment:IssuesEvent|Comment) => {
					if (isComment(eventOrComment)) {
						newItems.push(eventOrComment)
						
						// If there was a group then this stops appending to it
						return null
					
					} else {
						const
							event = eventOrComment
							
						if (!eventGroup || !eventGroup.acceptsEvent(event)) {
							eventGroup = new EventGroup(event)
							newItems.push(eventGroup)
						} else {
							eventGroup.addEvent(event)
						}
					}
					
					return eventGroup
				},null)
				
				return newItems
			})
			
		}
		
		this.setState({
			items
		})
	
		
		
	}
	
	
	/**
	 * On Mount - update the state
	 */
	componentWillMount = this.updateState
	
	/**
	 * When props change - update the state
	 */
	componentWillReceiveProps = this.updateState
	
	/**
	 * Should update simply shallow compares the states 'items' value
	 *
	 * @param nextProps
	 * @param nextState
	 * @param nextContext
	 */
	shouldComponentUpdate(nextProps:IIssueDetailPanelProps, nextState:IIssueDetailPanelState, nextContext:any):boolean {
		return !shallowEquals(this.state,nextState,'items') || !shallowEquals(this.props,nextProps,'activity')
	}
	
	/**
	 * Add label
	 */
	
	addLabel = (...issues:Issue[]) =>
		Container.get(IssueActionFactory).patchIssues("Label", ...issues)
	
	/**
	 * Change the assigned milestone
	 *
	 * @param issues
	 */
	editMilestone = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.patchIssues("Milestone", ...issues)
	
	/**
	 * Assign the issue
	 *
	 * @param issues
	 */
	assignIssue = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.patchIssues("Assignee", ...issues)
	
	
	/**
	 * Unassign the issues
	 *
	 * @param issues
	 */
	unassignIssue = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.applyPatchToIssues({ assignee: null }, true, ...issues)
	
	/**
	 * Callback for label or milestone remove
	 *
	 * @param issue
	 * @param item
	 */
	removeItem = (issue:Issue, item:Label|Milestone) => {
		const actions = Container.get(IssueActionFactory)
		
		log.info(`Removing item from issue`, item)
		
		if (!(item as any).id) {
			const
				label:Label = item as any,
				labels = [{action:'remove',label}] //issue.labels.filter(it => it.url !== label.url)
			
			actions.applyPatchToIssues({ labels }, true, issue)
		} else {
			actions.applyPatchToIssues({ milestone: null }, true, issue)
		}
	}
	
	/**
	 * Render when multiple styles are selected
	 *
	 * @param issues
	 * @param styles
	 */
	renderMulti = (issues:List<Issue>, styles) => <div>
		{issues.size} selected issues
	</div>
	
	
	/**
	 * Render the header
	 *
	 * @param issue
	 * @param styles
	 * @returns {any}
	 * @param palette
	 */
	renderHeader = (issue, styles, palette) => {
		
		
		const
			
			// EDIT CONTROLS
			controlStyle = {
				backgroundColor: palette.canvasColor,
				color: palette.textColor
			},
			
			editLabelsControl = canEditIssue(issue.repo, issue) &&
				<div style={FlexRowCenter}>
					
					{/* Add a tag/label */}
					<i key={`${issue.id}LabelEditIcon`}
					   onClick={() => this.addLabel(issue)}
					   style={[styles.header.row3.labels.add, controlStyle]}
					   className='material-icons'>add</i>
					
					{/* Add/change milestone */}
					{!issue.milestone && <i key={`${issue.id}MilestoneEditIcon`}
					                        onClick={() => this.editMilestone(issue)}
					                        style={[styles.header.row3.labels.add, controlStyle]}
					                        className='octicon octicon-milestone'/>
					}
				</div>
		
		return <div style={styles.header} {...getCommandProps(this)}>
			{/* ROW 1 */}
			<div style={styles.header.row1}>
				
				<div style={[styles.header.row1.repo]}>
					<Renderers.RepoName repo={issue.repo}/>
				</div>
				
				{/* ASSIGNEE */}
				<Avatar user={issue.assignee}
				        labelPlacement='before'
				        onRemove={
			        	issue.assignee &&
				            canAssignIssue(issue.repo) &&
				                (() => this.unassignIssue(issue))
			        }
				        onClick={canAssignIssue(issue.repo) && (() => this.assignIssue(issue))}
				        prefix={issue.assignee ? 'assigned to' : null}
				        prefixStyle={issue.assignee && {padding: '0 0.5rem 0 0'}}
				        style={styles.header.row1.assignee}
				        labelStyle={styles.username}
				        avatarStyle={styles.avatar}/>
			
			
			</div>
			
			{/* ROW 2 */}
			<div style={styles.header.row2}>
				{}
				<Textfit mode='multi' style={styles.header.row2.title}>{issue.title}</Textfit>
				
				{/* TIME */}
				<div
					style={[styles.time,canAssignIssue(issue.repo) && {marginRight:rem(0.5)}]}>{moment(issue.updated_at).fromNow()}</div>
			
			</div>
			
			{/* ROW 3 */}
			<div style={styles.header.row3}>
				{/* LABELS & MILESTONES */}
				<IssueLabelsAndMilestones labels={issue.labels}
				                          showIcon={true}
				                          onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
				                          milestones={issue.milestone && [issue.milestone]}
				                          onMilestoneClick={canEditIssue(issue.repo,issue) && (() => this.editMilestone(issue))}
				                          labelStyle={styles.header.row3.labels.label}
				                          afterAllNode={editLabelsControl}
				                          style={styles.header.row3.labels}/>
			
			
			</div>
		</div>
	}
	
	/**
	 * Render the footer (when comments go ;))
	 * @param issue
	 * @param styles
	 */
	renderFooter = (issue, styles) => <div style={styles.footer}/>
	
	
	/**
	 * Render the issue body if it has one
	 *
	 * @param items
	 * @param item
	 * @param selectedIssue
	 * @param index
	 * @param styles
	 */
	renderBody = (items:List<TDetailItem>,item:Issue,selectedIssue:Issue,index, styles) => <IssueActivityText
		key={'issue-body'}
		issue={this.props.selectedIssue}
		activityType='post'
		activityActionText='posted issue'
		activityStyle={styles.content.activities.activity}/>
	
	
	/**
	 * Render a comment
	 *
	 * @param items
	 * @param comment
	 * @param selectedIssue
	 * @param index
	 * @param styles
	 * @returns {any}
	 */
	renderComment = (items:List<TDetailItem>, comment:Comment,selectedIssue:Issue, index, styles) => <IssueActivityText
		key={comment.id}
		issue={selectedIssue}
		comment={comment}
		activityActionText='commented'
		activityType='comment'
		activityStyle={styles.content.activities.activity}/>
	
	/**
	 *
	 *
	 * @param items
	 * @param eventGroup
	 * @param selectedIssue
	 * @param index
	 * @param styles
	 */
	renderEventGroup = (items:List<TDetailItem>,eventGroup:EventGroup,selectedIssue:Issue,index,styles) => <IssueActivityText
		key={eventGroup.id}
		issue={selectedIssue}
		eventGroup={eventGroup}
		hideBottomBorder={index !== items.size - 1 && !isEventGroup(items.get(index+1))}
		activityType='eventGroup'
		activityStyle={styles.content.activities.activity}/>
	
	/**
	 * Render an item for the activity list
	 *
	 * @param items
	 * @param index
	 * @returns {any}
	 */
	renderDetailItem = (items:List<TDetailItem>, index) => {
		const
			issue = items.get(0) as Issue,
			item = items.get(index)
			
		return isIssue(item) ?
			this.renderBody(items,item,issue,index, this.props.styles) :
			
				isEventGroup(item) ?
					this.renderEventGroup(items,item,issue,index,this.props.styles) :
					
					this.renderComment(items,item,issue, index, this.props.styles)
	}
	
	
	/**
	 * Render issue
	 *
	 * @param issue
	 * @param items
	 * @param styles
	 * @param palette
	 * @returns {any}
	 */
	renderIssue = (issue:Issue,items:List<TDetailItem>, styles, palette) => issue && <div style={styles.issue}>
		
		<Style
			scopeSelector={`.markdown.issue-${issue.id}`}
			rules={styles.markdown}
		/>
		
		{this.renderHeader(issue, styles, palette)}
		
		{/* Issue Detail Body */}
		<div style={styles.content}>
			<div style={styles.content.wrapper}>
				<VisibleList
					items={items}
					itemCount={items.size}
					itemRenderer={this.renderDetailItem}
				  itemKeyFn={(listItems,item,index) => {
            log.info(`Getting id for`,item)
            
            return `${_.get(item,'id',index)}`
           }}
				/>
			</div>
		</div>
		
		{this.renderFooter(issue, styles)}
	
	</div>
	
	
	/**
	 * Component render method
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ selectedIssueIds, activity,issues, theme, styles } = this.props,
			{items} = this.state,
			{selectedIssue} = activity
		
		if (!List.isList(issues))
			return React.DOM.noscript()
		
		return (!selectedIssueIds || !selectedIssueIds.length) ? <div/> :
			<div id='issueDetailPanel'
			         style={styles.root}>
				{ !selectedIssue ?
					this.renderMulti(issues.filter(it => it && selectedIssueIds.includes(it.id)) as List<Issue>, styles) :
					this.renderIssue(selectedIssue, items,styles, theme.palette)
				}
			</div>
	}
	
}