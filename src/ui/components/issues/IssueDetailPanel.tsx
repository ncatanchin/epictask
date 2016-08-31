/**
 * Created by jglanz on 5/30/16.
 */

// Imports

import * as moment from 'moment'
import * as React from 'react'
import * as Radium from 'radium'
import {Style} from 'radium'
import {connect} from 'react-redux'
import {Avatar, PureRender, Renderers} from 'components/common'
import {Issue} from 'shared/models/Issue'
import {Comment} from 'shared/models/Comment'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'
import {IssueActivityText} from './IssueActivityText'
import {createStructuredSelector, createSelector} from 'reselect'
import {Themed} from 'shared/themes/ThemeManager'
import {issuesDetailSelector, selectedIssueSelector, commentsSelector} from 'shared/actions/issue/IssueSelectors'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {HotKeys} from 'react-hotkeys'
import {Milestone} from 'shared/models/Milestone'
import {Label} from 'shared/models/Label'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {Container} from 'typescript-ioc'
import {canEditIssue,canAssignIssue} from 'shared/Permission'
//import {Button, Icon} from 'epictask/ui/components/common'

import baseStyles from './IssueDetailPanel.styles'


// Non-typed Components
const {Textfit} = require('react-textfit')
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)

/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps {
	issues?:Issue[]
	issue?:Issue
	comments?:Comment[]
	theme?:any,
	styles?:any
}


/**
 * Create a new issue item to state => props mapper
 *
 * @returns {any}
 */
const makeIssueItemStateToProps = () => {



	return createStructuredSelector({
		issues: issuesDetailSelector,
		issue: selectedIssueSelector,
		comments: commentsSelector,
		styles: (state,props) => mergeStyles(baseStyles, props.theme.issueDetail)
	},createDeepEqualSelector)
}




/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/

@Themed
@connect(makeIssueItemStateToProps)
@HotKeyContext()
@PureRender
@Radium
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

	refs:{[name:string]:any}


	/**
	 * Add label
	 */

	addLabel = (...issues:Issue[]) => Container.get(IssueActionFactory).patchIssues("Label",...issues)

	/**
	 * Change the assigned milestone
	 *
	 * @param issues
	 */
	editMilestone = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.patchIssues("Milestone",...issues)

	assignIssue = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.patchIssues("Assignee",...issues)

	unassignIssue = (...issues:Issue[]) =>
		Container.get(IssueActionFactory)
			.applyPatchToIssues({assignee: null},true,...issues)

	/**
	 * Callback for label or milestone remove
	 *
	 * @param issue
	 * @param item
	 */
	removeItem = (issue:Issue,item:Label|Milestone) => {
		const actions = Container.get(IssueActionFactory)

		log.info(`Removing item from issue`,item)

		if (!(item as any).id) {
			const
				label:Label = item as any,
				labels = issue.labels.filter(it => it.url !== label.url)

			actions.applyPatchToIssues({labels},true,issue)
		} else {
			actions.applyPatchToIssues({milestone:null},true,issue)
		}
	}

	/**
	 * Render when multiple styles are selected
	 *
	 * @param issues
	 * @param styles
	 */
	renderMulti = (issues:Issue[], styles) => <div>
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
	renderHeader = (issue, styles,palette) => <div style={styles.header}>
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
			<div style={[styles.time,canAssignIssue(issue.repo) && {marginRight:rem(0.5)}]}>{moment(issue.updated_at).fromNow()}</div>

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
			                          afterAllNode={
										canEditIssue(issue.repo,issue) &&
			                                <div style={FlexRowCenter}>
												{/* Add a tag/label */}
												<i key={`${issue.id}LabelEditIcon`} onClick={() => this.addLabel(issue)}
				                                   style={[
				                                        styles.header.row3.labels.add, {
				                                            backgroundColor: palette.canvasColor,
				                                            color: palette.textColor
				                                        }
			                                        ]}
				                                   className='material-icons'>add</i>

				                                {/* Add/change milestone */}
				                                {!issue.milestone &&
					                                <i key={`${issue.id}MilestoneEditIcon`} onClick={() => this.editMilestone(issue)}
					                                   style={[
					                                        styles.header.row3.labels.add, {
					                                            backgroundColor: palette.canvasColor,
					                                            color: palette.textColor
					                                        }
				                                        ]}
					                                   className='octicon octicon-milestone'/>
				                                }
		                                    </div>

			                          }
			                          style={styles.header.row3.labels}/>



		</div>
	</div>


	/**
	 * Render the footer (when comments go ;))
	 * @param issue
	 * @param s
	 * @returns {any}
	 */
	renderFooter = (issue, styles) => <div style={styles.footer}>
		<div>
			add comment here
		</div>
	</div>


	/**
	 * Render the issue body if it has one
	 *
	 * @param key
	 * @param styles
	 * @returns {any}
	 */
	renderBody = (key,styles) => <IssueActivityText
			key={key}
			commentIndex={-1}
			activityType='post'
			activityActionText='posted issue'
			activityStyle={styles.content.activities.activity}/>



	/**
	 * Render a comment
	 *
	 * @param key
	 * @param index
	 * @param styles
	 * @returns {any}
	 */
	renderComment = (key,index,styles) => <IssueActivityText
			key={key}
			commentIndex={index }
			activityActionText='commented'
			activityType='comment'
			activityStyle={styles.content.activities.activity}/>



	/**
	 * Render an item for the activity list
	 *
	 * @param index
	 * @param key
	 * @returns {any}
	 */
	renderActivityListItem = (index,key) => (index === 0) ?
		this.renderBody(key,this.props.styles) :
		this.renderComment(key,index - 1,this.props.styles)



	/**
	 * Render issue
	 *
	 * @param issue
	 * @param comments
	 * @param styles
	 * @param palette
	 * @returns {any}
	 */
	renderIssue = (issue:Issue, comments:Comment[], styles,palette) => <div style={styles.issue}>
		<Style
			scopeSelector={`.markdown.issue-${issue.id}`}
			rules={styles.markdown}
		/>

		{this.renderHeader(issue, styles,palette)}

		{/* Issue Detail Body */}
		<div style={styles.content}>
			<div style={styles.content.wrapper}>
				<ReactList itemRenderer={this.renderActivityListItem}
				           length={comments ? comments.length + 1 : 1}
				           type='simple'/>
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
		const {issues, theme, comments,styles} = this.props

		return (!issues || !issues.length) ? <div/> :
			<HotKeys id='issueDetailPanel'
			         style={styles.root}>
				{ issues.length > 1 ?
					this.renderMulti(issues, styles) :
					this.renderIssue(issues[0], comments, styles,theme.palette)
				}
			</HotKeys>
	}

}