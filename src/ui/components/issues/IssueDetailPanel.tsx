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
import {IssueLabels} from './IssueLabels'
import {IssueActivityText} from './IssueActivityText'
import {createStructuredSelector, createSelector} from 'reselect'
import {Themed} from 'shared/themes/ThemeManager'
import {issuesDetailSelector, issueSelector, commentsSelector} from 'shared/actions/issue/IssueSelectors'


// Non-typed Components
const {Textfit} = require('react-textfit')
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)

//region Styles
const flexTransition = makeTransition(['height', 'flex', 'flex-grow', 'flex-shrink', 'flex-basis'])
const baseStyles = {
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
		issue: issueSelector,
		comments: commentsSelector,
		theme: themeSelector,
		styles: stylesSelector
	})
}

// function mapStateToProps(state) {
// 	const repoState = state.get(RepoKey)
//
// 	return {
// 		issues:   repoState.selectedIssues || List(),
// 		issue:   repoState.selectedIssue,
// 		comments: repoState.comments
// 	}
// }



/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/


@Radium

@connect(makeIssueItemStateToProps)

@PureRender
@Themed
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

	refs:{[name:string]:any}

	static defaultProps = {
		theme: getTheme()
	}

	constructor(props,context) {
		super(props,context)
	}

	renderMulti(issues:Issue[], s) {
		return <div>
			{issues.size} selected issues
		</div>
	}

	/**
	 * Render the header
	 *
	 * @param issue
	 * @param styles
	 * @returns {any}
	 */
	renderHeader(issue, styles) {
		const {header} = styles,
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
				        labelStyle={styles.username}
				        avatarStyle={styles.avatar}/>


			</div>
			<div style={row2}>

				<Textfit mode='multi' style={row2.title}>{issue.title}</Textfit>
				{/* TIME */}
				<div style={styles.time}>{moment(issue.updated_at).fromNow()}</div>

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

	/**
	 * Render the footer (when comments go ;))
	 * @param issue
	 * @param s
	 * @returns {any}
	 */
	renderFooter(issue, s) {
		return <div style={s.footer}>
			<div >
				add comment here
			</div>
		</div>
	}

	/**
	 * Render the issue body if it has one
	 *
	 * @param key
	 * @param styles
	 * @returns {any}
	 */
	renderBody = (key,styles) => {
		const
			{activity} = styles.content.activities

		return <IssueActivityText
			key={key}
			commentIndex={-1}
			activityType='post'
			activityActionText='posted issue'
			activityStyle={activity}/>

	}


	/**
	 * Render a comment
	 *
	 * @param key
	 * @param index
	 * @param styles
	 * @returns {any}
	 */
	renderComment = (key,index,styles) => {
		const
			{activity} = styles.content.activities


		return <IssueActivityText
			key={key}
			commentIndex={index}
			activityActionText='commented'
			activityType='comment'
			activityStyle={activity}/>

	}

	/**
	 * Render an item for the activity list
	 *
	 * @param index
	 * @param key
	 * @returns {any}
	 */
	renderActivityListItem = (index,key) => {
		const {issues,issue,theme, comments,styles} = this.props

		return (index === 0) ? this.renderBody(key,styles) :
			this.renderComment(key,index,styles)

	}

	/**
	 * Render issue
	 *
	 * @param issue
	 * @param comments
	 * @param styles
	 * @returns {any}
	 */
	renderIssue(issue:Issue, comments:Comment[], styles) {
		const {content} = styles
		//comments ? comments.length : 0
		return <div style={styles.issue}>
			<Style
				scopeSelector={`.markdown.issue-${issue.id}`}
				rules={styles.markdown}
			/>

			{this.renderHeader(issue, styles)}

			{/* Issue Detail Body */}
			<div style={content}>
				<div style={content.wrapper}>
					<ReactList itemRenderer={this.renderActivityListItem}
					           length={comments ? comments.length + 1 : 1}
					           type='simple'/>
				</div>
			</div>

			{this.renderFooter(issue, styles)}

		</div>
	}

	/**
	 * Component render method
	 *
	 * @returns {any}
	 */
	render() {
		const {issues, theme, comments,styles} = this.props

		return <div style={styles.root}>
			{issues.length === 0 ? <div/> :
				issues.length > 1 ?
					this.renderMulti(issues, styles) :
					this.renderIssue(issues[0], comments, styles)
			}
		</div>
	}

}