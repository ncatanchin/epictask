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
import {Issue, Comment} from 'shared/models'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'
import {IssueActivityText} from './IssueActivityText'
import {createStructuredSelector, createSelector} from 'reselect'
import {Themed} from 'shared/themes/ThemeManager'
import {issuesDetailSelector, selectedIssueSelector, commentsSelector} from 'shared/actions/issue/IssueSelectors'
import baseStyles from './IssueDetailPanelStyles'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'

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

	const themeSelector = () => getTheme()
	const stylesSelector = createSelector(
		() => getTheme(),
		(theme:any) => mergeStyles(baseStyles, theme.issueDetail)
	)


	return createStructuredSelector({
		issues: issuesDetailSelector,
		issue: selectedIssueSelector,
		comments: commentsSelector,
		theme: themeSelector,
		styles: stylesSelector
	},createDeepEqualSelector)
}




/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/


@connect(makeIssueItemStateToProps)
@Radium
@Themed
@HotKeyContext()
@PureRender
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

	refs:{[name:string]:any}

	constructor(props,context) {
		super(props,context)
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
	 */
	renderHeader = (issue, styles) => <div style={styles.header}>
		{/* ROW 1 */}
		<div style={styles.header.row1}>
			<div style={styles.header.row1.repo}>
				{Renderers.repoName(issue.repo)}
			</div>

			{/* ASSIGNEE */}
			<Avatar user={issue.assignee}
			        labelPlacement='before'
			        prefix={issue.assignee ? 'assigned to' : null}

			        prefixStyle={{padding: '0 0.5rem 0 0'}}
			        style={styles.header.row1.assignee}
			        labelStyle={styles.username}
			        avatarStyle={styles.avatar}/>


		</div>

		{/* ROW 2 */}
		<div style={styles.header.row2}>

			<Textfit mode='multi' style={styles.header.row2.title}>{issue.title}</Textfit>
			{/* TIME */}
			<div style={styles.time}>{moment(issue.updated_at).fromNow()}</div>

		</div>

		{/* ROW 3 */}
		<div style={styles.header.row3}>
			{/* LABELS */}
			<IssueLabelsAndMilestones labels={issue.labels} style={styles.header.row3.labels}/>

			{/* MILESTONE */}
			{issue.milestone && <div style={styles.header.row3.milestone}>
				{issue.milestone.title}
			</div>}
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
			commentIndex={index}
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
		this.renderComment(key,index,this.props.styles)



	/**
	 * Render issue
	 *
	 * @param issue
	 * @param comments
	 * @param styles
	 * @returns {any}
	 */
	renderIssue = (issue:Issue, comments:Comment[], styles) => <div style={styles.issue}>
		<Style
			scopeSelector={`.markdown.issue-${issue.id}`}
			rules={styles.markdown}
		/>

		{this.renderHeader(issue, styles)}

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

		return (!issues || issues.length == 0) ? <div/> : <div style={styles.root}>
			{ issues.length > 1 ?
				this.renderMulti(issues, styles) :
				this.renderIssue(issues[0], comments, styles)
			}
		</div>
	}

}