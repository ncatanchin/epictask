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
import { IssueLabelsAndMilestones } from './IssueLabelsAndMilestones'
import { IssueActivityText } from './IssueActivityText'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import {
	selectedIssueIdsSelector, issuesSelector, commentsSelector
} from 'shared/actions/issue/IssueSelectors'
import { HotKeyContext } from 'ui/components/common/HotKeyContext'

import { HotKeys } from "ui/components/common/Other"
import { Milestone } from 'shared/models/Milestone'
import { Label } from 'shared/models/Label'
import { IssueActionFactory } from 'shared/actions/issue/IssueActionFactory'
import { Container } from 'typescript-ioc'
import { canEditIssue, canAssignIssue } from 'shared/Permission'
//import {Button, Icon} from 'epictask/ui/components/common'

import baseStyles from './IssueDetailPanel.styles'
import { VisibleList } from "ui/components/common/VisibleList"


// Other stuff
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)

/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps {
	selectedIssueIds?:number[]
	issues?:List<Issue>
	comments?:List<Comment>
	theme?:any,
	styles?:any
}


/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/

@HotKeyContext()
@connect(createStructuredSelector({
	selectedIssueIds: selectedIssueIdsSelector,
	issues: issuesSelector,
	comments: commentsSelector
}))
@ThemedStyles(baseStyles, 'issueDetail')
@PureRender
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {
	
	refs:{[name:string]:any}
	
	/**
	 * Add label
	 */
	
	addLabel = (issues:List<Issue>) => Container.get(IssueActionFactory).patchIssues("Label", ...issues.toArray())
	
	/**
	 * Change the assigned milestone
	 *
	 * @param issues
	 */
	editMilestone = (issues:List<Issue>) =>
		Container.get(IssueActionFactory)
			.patchIssues("Milestone", ...issues.toArray())
	
	assignIssue = (issues:List<Issue>) =>
		Container.get(IssueActionFactory)
			.patchIssues("Assignee", ...issues.toArray())
	
	unassignIssue = (issues:List<Issue>) =>
		Container.get(IssueActionFactory)
			.applyPatchToIssues({ assignee: null }, true, ...issues.toArray())
	
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
				labels = issue.labels.filter(it => it.url !== label.url)
			
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
		
		return <div style={styles.header}>
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
	 * @param comments
	 * @param index
	 * @param styles
	 */
	renderBody = (comments:List<Comment>, index, styles) => <IssueActivityText
		key={'issue-body'}
		issue={this.props.issues.get(0)}
		activityType='post'
		activityActionText='posted issue'
		activityStyle={styles.content.activities.activity}/>
	
	
	/**
	 * Render a comment
	 *
	 * @param comments
	 * @param index
	 * @param styles
	 * @returns {any}
	 */
	renderComment = (comments:List<Comment>, index, styles) => <IssueActivityText
		key={comments.get(index).id}
		issue={this.props.issues.get(0)}
		comment={comments.get(index)}
		activityActionText='commented'
		activityType='comment'
		activityStyle={styles.content.activities.activity}/>
	
	
	/**
	 * Render an item for the activity list
	 *
	 * @param comments
	 * @param index
	 * @returns {any}
	 */
	renderActivityListItem = (comments:List<Comment>, index) => (index === 0) ?
		this.renderBody(comments, index, this.props.styles) :
		this.renderComment(comments, index - 1, this.props.styles)
	
	
	/**
	 * Render issue
	 *
	 * @param issue
	 * @param comments
	 * @param styles
	 * @param palette
	 * @returns {any}
	 */
	renderIssue = (issue:Issue, comments:List<Comment>, styles, palette) => issue && <div style={styles.issue}>
		
		<Style
			scopeSelector={`.markdown.issue-${issue.id}`}
			rules={styles.markdown}
		/>
		
		{this.renderHeader(issue, styles, palette)}
		
		{/* Issue Detail Body */}
		<div style={styles.content}>
			<div style={styles.content.wrapper}>
				<VisibleList
					items={List(comments).push(null)}
					itemCount={comments.size + 1}
					itemRenderer={this.renderActivityListItem}
				
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
			{ selectedIssueIds, issues, theme, comments, styles } = this.props
		
		if (!List.isList(issues))
			return React.DOM.noscript()
		
		return (!selectedIssueIds || !selectedIssueIds.length) ? <div/> :
			<HotKeys id='issueDetailPanel'
			         style={styles.root}>
				{ selectedIssueIds.length > 1 ?
					this.renderMulti(issues.filter(it => it && selectedIssueIds.includes(it.id)) as List<Issue>, styles) :
					this.renderIssue(issues.find(it => it && selectedIssueIds[ 0 ] === it.id), comments, styles, theme.palette)
				}
			</HotKeys>
	}
	
}