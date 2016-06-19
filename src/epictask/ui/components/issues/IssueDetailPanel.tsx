/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import * as Radium from 'radium'
import {Style} from 'radium'
import {connect} from 'react-redux'
import {Avatar, Markdown, PureRender, Renderers} from 'components/common'
import {Issue, Comment, Label, Milestone, Repo} from 'shared/models'
import {AppKey, RepoKey} from 'shared/Constants'
import {IssueLabels} from './IssueLabels'
import {IssueActivityText} from './IssueActivityText'

const {Textfit} = require('react-textfit')


// Constants
const log = getLogger(__filename)

//region Styles
const flexTransition = makeTransition(['height', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'])
const styles = {
	root: makeStyle(FlexColumn, Fill, OverflowHidden, {
		minWidth: '36.5rem'
	}),

	time: makeStyle(FlexAuto, {
		fontSize:   themeFontSize(1),
		fontWeight: 100
	}),

	issue: makeStyle(flexTransition, FlexColumn, FlexScale, {}),

	issueMulti: makeStyle(FlexColumn, FlexScale, {}),

	header: makeStyle(flexTransition, FlexAuto, FlexColumn, {
		padding: "1rem",

		row1: makeStyle(FlexRowCenter, FlexAuto, {
			repo:     makeStyle(FlexScale, {
				fontSize:            themeFontSize(1.4),
				padding:             '0 0 0.5rem 0',
				fontWeight:          500,
				fontSmooth:          'always',
				WebkitFontSmoothing: 'antialiased'
			}),
			assignee: makeStyle({
				padding: '0 0 0 1rem'
			})
		}),

		row2: makeStyle(FlexRowCenter, FlexAuto, PositionRelative, {
			padding: '0.5rem 0 1rem 0',
			title:   makeStyle(OverflowHidden, PositionRelative, FlexScale, {
				fontSize:     themeFontSize(2),
				textOverflow: 'clip ellipsis',
				lineHeight:   '2.2rem',
				maxHeight:    '4.4rem',
				maxWidth:     '100%'
			}),


		}),

		// Row 3 - Labels + title
		row3: makeStyle(flexTransition, FlexRowCenter, FlexAuto, {
			labels:    makeStyle(FlexScale, FlexAlignStart, {}),
			milestone: makeStyle({})
		})


	}),

	/**
	 * ISSUE DETAILS / COMMENTS / BODY
	 */
	content: makeStyle(flexTransition, FlexColumn, FlexScale, {
		wrapper: makeStyle(FlexColumn, FlexScale, {
			padding:   '1rem 0rem',
			overflowX: 'hidden',
			overflowY: 'auto'
		}),

		body: makeStyle(flexTransition, FlexAuto, {
			boxShadow: 'inset 0 -0.1rem 0.4rem -0.4rem black',
			padding:   '1rem 1rem 1rem 2rem'
		}),

		activities: makeStyle(flexTransition, FlexColumn, FlexAuto, {
			activity: makeStyle(flexTransition, FlexRow, makeFlexAlign('flex-start', 'flex-start'),
				FlexAuto, {

					title: makeStyle(flexTransition, FlexColumn, FlexAuto, {}),

					margin: '1rem 1rem 1rem 0.5rem',

					avatar: {
						width:        41,
						height:       41,
						borderRadius: '50%'
					},

					user: {
						// borderWidth: '0.1rem',
						// borderStyle: 'solid',
						borderRadius: '50% 0 0 50%'
					}
				})
		}),
	}),

	/**
	 * PANEL FOOTER
	 */
	footer: makeStyle(flexTransition, FlexAuto, {}),

	markdown: makeStyle({
		padding:   '1rem',
		overflowY: 'visible',
		overflowX: 'auto',
		height:    'auto',

		'pre': {
			width:     '100%',
			boxSizing: 'border-box'
		}
	})

}
//endregion


function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)

	return {
		theme:    appState.theme,
		issues:   repoState.selectedIssues,
		repos:    repoState.repos,
		comments: repoState.comments
	}
}

/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps {
	issues?:Issue[]
	repos?:Repo[]
	comments?:Comment[]
	theme?:any
}


/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

	refs:{[name:string]:any}

	constructor(props:any) {
		super(props)

	}


	renderMulti(issues:Issue[], s) {
		return <div>
			{issues.length} selected issues
		</div>
	}

	renderHeader(issue, s) {
		const {header} = s,
			{row1, row2, row3} = header,
			{repo} = issue


		return <div style={header}>
			<div style={row1}>
				<div style={row1.repo}>
					{Renderers.repoName(repo)}
				</div>

				{/* ASSIGNEE */}
				<Avatar user={issue.assignee}
				        style={row1.assignee}
				        prefix={issue.assignee ? 'assigned to' : null}
				        prefixStyle={{padding: '0 0.5rem 0 0'}}
				        labelPlacement='before'
				        labelStyle={s.username}
				        avatarStyle={s.avatar}/>


			</div>
			<div style={row2}>

				<Textfit mode='multi' style={row2.title}>{issue.title}</Textfit>
				{/* TIME */}
				<div style={s.time}>{moment(issue.updated_at).fromNow()}</div>

			</div>
			<div style={row3}>
				{/* LABELS */}
				<IssueLabels labels={issue.labels} style={row3.labels}/>

				{/* MILESTONE */}
				{issue.milestone && <div style={row3.milestone}>
					{issue.milestone.title}
				</div>}
			</div>


		</div>
	}

	renderFooter(issue, s) {
		return <div style={s.footer}>
			<div >
				add comment here
			</div>
		</div>
	}

	renderBody(issue, s) {
		const
			{activity} = s.content.activities

		return <IssueActivityText
			key={issue.id}
			user={issue.user}
			text={issue.body}
			activityActionText='posted issue'
			activityType='post'
			createdAt={issue.created_at}
			updatedAt={issue.updated_at}
			issue={issue}
			activityStyle={activity}/>

	}


	// COMMENT
	renderComment(issue, comment, s) {
		const
			{activity} = s.content.activities


		return <IssueActivityText
			key={comment.id}
			user={comment.user}
			text={comment.body}
			activityActionText='commented'
			activityType='comment'
			createdAt={comment.created_at}
			updatedAt={comment.updated_at}
			issue={issue}
			activityStyle={activity}/>

	}

	renderActivities(issue, comments, s) {
		comments = comments || []

		const
			{content} = s,
			{activities} = content,
			{activity} = activities

		return <div style={activities}>
			{comments.map(comment => this.renderComment(issue, comment, s))}
		</div>
	}

	renderIssue(issue:Issue, comments:Comment[], s) {
		const {content} = s

		return <div style={s.issue}>
			<Style
				scopeSelector={`.markdown.issue-${issue.id}`}
				rules={s.markdown}
			/>

			{this.renderHeader(issue, s)}

			{/* Issue Detail Body */}
			<div style={content}>
				<div style={content.wrapper}>

					{this.renderBody(issue, s)}
					{this.renderActivities(issue, comments, s)}
				</div>
			</div>

			{this.renderFooter(issue, s)}

		</div>
	}

	render() {
		const
			{issues, theme, comments} = this.props,
			s = mergeStyles(styles, theme.issueDetail)

		return <div style={s.root}>
			{issues.length === 0 ? <div/> :
				issues.length > 1 ?
					this.renderMulti(issues, s) :
					this.renderIssue(issues[0], comments, s)
			}
		</div>
	}

}