/**
 * Created by jglanz on 5/30/16.
 */
// Imports
import { List } from "immutable"

import { Style } from "radium"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { Button, VisibleList } from "epic-ui-components"
import { Issue, Comment, IssuesEvent, isComment, isIssue, getEventGroupType } from "epic-models"

import { ThemedStyles } from "epic-styles"
import {
	selectedIssueIdsSelector,
	issuesSelector,
	selectedIssueSelector,
	activitySelector,
	activityLoadingSelector,
	TIssueActivity,
	getIssueActions
} from "epic-typedux"
import baseStyles from "./IssueDetailPanel.styles"
import { shallowEquals, getValue, unwrapRef } from "epic-global"
import { EventGroup, isEventGroup } from "./IssueEventGroup"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	ICommandComponentProps
} from "epic-command-manager-ui"
import { ContainerNames } from "epic-command-manager"
import { IssueDetailHeader } from "./IssueDetailHeader"
import { IssueMultiInlineList } from "./IssueMultiInlineList"

import { IssueActivityText } from "./IssueActivityText"
// Other stuff
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)


type TDetailItem = Comment|EventGroup|Issue


/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps extends ICommandComponentProps {
	theme?:any
	styles?:any
	
	selectedIssueIds?:number[]
	selectedIssue?:Issue
	issues?:List<Issue>
	activity?:TIssueActivity
	activityLoading?:boolean
	
}

export interface IIssueDetailPanelState {
	items?:List<TDetailItem>
	listRef?:any
	
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
	activity: activitySelector,
	activityLoading: activityLoadingSelector
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'issueDetail')
//@PureRender
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,IIssueDetailPanelState> implements ICommandComponent {
	
	
	
	
	refs:{[name:string]:any}
	
	/**
	 * Commands for the container
	 */
	commandItems = (builder:CommandContainerBuilder) =>
	  // NEW COMMENT
		builder
			// .command(
			// 	CommandType.Container,
			// 	'New Comment',
			// 	(cmd, event) => getIssueActions().newComment(),
			// 		"Ctrl+m", {
			// 		menuPath:['Issue']
			// 	})
			.make()
	/*
	 * Insert images (Drag and drop and select)
	 * Handle clicks in viewers (links)
	 * make editor look dope everywhere
	 */
	
	/**
	 * Command component id
	 *
	 * @type {string}
	 */
	readonly commandComponentId:string = ContainerNames.IssueDetailPanel
	
	
	/**
	 * List ref
	 *
	 * @param listRef
	 */
	private setListRef = (listRef) => this.setState({listRef})
	
	/**
	 * Update the state when props change
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{ activity:currentActivity, selectedIssue:currentSelectedIssue } = this.props,
			{ activity } = props,
			{ events, comments, selectedIssue } = activity
		
		let
			items:List<TDetailItem> = this.state && this.state.items
		
		// CHECK CHANGES OR FIRST LOAD
		const
			itemsChanged = !items || !shallowEquals(selectedIssue, currentSelectedIssue, 'updated_at') || !shallowEquals(currentActivity, activity, 'events', 'comments')
		
		// IF NO CHANGES THEN RETURN
		if (!itemsChanged) {
			log.debug(`Items did not change in issue details`)
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
				eventsAndComments.reduce((eventGroup:EventGroup, eventOrComment:IssuesEvent|Comment) => {
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
				}, null)
				
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
		const
			themeChanged = !shallowEquals(this.props,'theme')
		
		setTimeout(() => {
			getValue(() => unwrapRef(this.state.listRef).forceUpdate())
		},150)
		
		return !shallowEquals(this.state, nextState, 'items') ||
			!shallowEquals(this.props, nextProps,
				'activity','selectedIssue','selectedIssueIds') || themeChanged
	}
	
	/**
	 * Render when multiple styles are selected
	 *
	 * @param issues
	 * @param styles
	 */
	renderMulti = (issues:List<Issue>, styles) => <div style={styles.multi}>
		<div style={styles.multi.title}>
			{issues.size} selected issues
		</div>
		<div style={styles.multi.title}>
			<Button mode='raised' sizing='big' style={styles.multi.button} onClick={() => getIssueActions().patchIssuesAssignee()}>
				Assign
			</Button>
			<Button mode='raised' sizing='big' style={styles.multi.button} onClick={() => getIssueActions().patchIssuesLabel()}>
				Labels
			</Button>
			<Button mode='raised' sizing='big' style={styles.multi.button} onClick={() => getIssueActions().patchIssuesMilestone()}>
				Milestone
			</Button>
		</div>
		<IssueMultiInlineList issues={issues} />
		
	</div>
	
	
	/**
	 * Render the header
	 *
	 * @param issue
	 * @param styles
	 * @param palette
	 * @returns {any}
	 */
	renderHeader = (issue, styles, palette) => {
		return <IssueDetailHeader />
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
	renderBody = (items:List<TDetailItem>, item:Issue, selectedIssue:Issue, index, styles) => <IssueActivityText
		key={'issue-body'}
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
	renderComment = (items:List<TDetailItem>, comment:Comment, selectedIssue:Issue, index, styles) => <IssueActivityText
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
	renderEventGroup = (items:List<TDetailItem>, eventGroup:EventGroup, selectedIssue:Issue, index, styles) =>
		<IssueActivityText
			key={eventGroup.id}
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
			this.renderBody(items, item, issue, index, this.props.styles) :
			
			isEventGroup(item) ?
				this.renderEventGroup(items, item, issue, index, this.props.styles) :
				
				this.renderComment(items, item, issue, index, this.props.styles)
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
	renderIssue = (issue:Issue, items:List<TDetailItem>, styles, palette) => issue && <div style={styles.issue}>
		
		<Style
			scopeSelector={`.markdown.issue-${issue.id}`}
			rules={styles.markdown}
		/>
		
		{this.renderHeader(issue, styles, palette)}
		
		{/* Issue Detail Body */}
		<div style={styles.content}>
			<div style={styles.content.wrapper}>
				{!this.props.activityLoading &&
					<VisibleList
						ref={this.setListRef}
						items={items}
						itemCount={items.size}
						itemRenderer={this.renderDetailItem}
						itemKeyFn={(listItems,item,index) => `${_.get(item,'id',index)}`}
					/>
				}
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
			{ selectedIssueIds, activity, issues, theme, styles } = this.props,
			{ items } = this.state,
			{ selectedIssue } = activity,
			noSelectedIssues = !selectedIssueIds || !selectedIssueIds.length
		
		if (!List.isList(issues))
			return React.DOM.noscript()
		
		return <CommandRoot
			component={this}
			id='issueDetailPanel'
			style={!noSelectedIssues && styles.root}
		>
			{
				noSelectedIssues ? <div/> :
					!selectedIssue ?
						this.renderMulti(issues.filter(it => it && selectedIssueIds.includes(it.id)) as List<Issue>, styles) :
						this.renderIssue(selectedIssue, items, styles, theme.palette)
			}
		</CommandRoot>
	}
	
}