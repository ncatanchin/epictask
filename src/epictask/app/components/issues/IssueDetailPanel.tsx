/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import * as Radium from 'radium'
import {Style} from 'radium'
import {connect} from 'react-redux'
import {Avatar,Markdown,Renderers} from 'components/common'
import {Issue,Comment,Label,Milestone,Repo} from 'shared/models'
import {AppKey, RepoKey} from 'shared/Constants'
import {IssueLabels} from './IssueLabels'

const {Textfit} = require('react-textfit')


// Constants
const log = getLogger(__filename)

//region Styles
const flexTransition = makeTransition(['height','flex','flex-grow','flex-shrink','flex-basis'])
const styles = {
	root: makeStyle(FlexColumn,Fill,{
		minWidth: '36.5rem'
	}),

	time: makeStyle(FlexAuto,{
		fontSize: themeFontSize(1),
		fontWeight: 100
	}),

	issue: makeStyle(flexTransition,FlexColumn,FlexScale,{

	}),

	issueMulti: makeStyle(FlexColumn,FlexScale,{

	}),

	header: makeStyle(flexTransition,FlexAuto,FlexColumn,{
		padding: "1rem",

		row1: makeStyle(FlexRowCenter,FlexAuto,{
			repo: makeStyle(FlexScale,{
				fontSize: themeFontSize(1.4),
				padding: '0 0 0.5rem 0',
				fontWeight: 500,
				fontSmooth: 'always',
				WebkitFontSmoothing: 'antialiased'
			}),
			assignee: makeStyle({
				padding: '0 0 0 1rem'
			})
		}),

		row2: makeStyle(FlexRowCenter,FlexAuto,PositionRelative,{
			padding: '0.5rem 0 1rem 0',
			title: makeStyle(OverflowHidden,PositionRelative,FlexScale, {
				fontSize:        themeFontSize(2),
				textOverflow: 'clip ellipsis',
				lineHeight: '2.2rem',
				maxHeight: '4.4rem',
				maxWidth: '100%'
			}),


		}),

		// Row 3 - Labels + title
		row3: makeStyle(flexTransition,FlexRowCenter,FlexAuto,{
			labels: makeStyle(FlexScale,FlexAlignStart,{

			}),
			milestone: makeStyle({

			})
		})


	}),

	/**
	 * ISSUE DETAILS / COMMENTS / BODY
	 */
	content: makeStyle(flexTransition,FlexColumn,FlexScale,{
		wrapper: makeStyle(FlexColumn,FlexScale,{
			padding: '1rem 0rem'
		}),

		body: makeStyle(flexTransition,FlexAuto,{
			boxShadow: 'inset 0 -0.1rem 0.4rem -0.4rem black',
			padding: '1rem 1rem 1rem 2rem'
		}),

		activities: makeStyle(flexTransition,FlexColumn,FlexAuto,{
			activity: makeStyle(flexTransition,FlexRow,makeFlexAlign('flex-start','center'),
				FlexAuto,{

				title: makeStyle(flexTransition,FlexColumn,FlexAuto,{}),

				margin: '1rem 1rem 1rem 0.5rem',

				avatar: {
					width: 41,
					height: 41
				},

				user: {
					// borderWidth: '0.1rem',
					// borderStyle: 'solid',
					borderRadius: '50% 0 0 50%'
				},

				comment: makeStyle(FlexColumn,FlexScale,{
					borderWidth: '0.1rem',
					borderStyle: 'solid',
					borderRadius: '0 0.2rem 0.2rem 0.2rem',

					details: makeStyle(FlexRow,makeFlexAlign('center','flex-start'),FlexAuto,PositionRelative,{
						padding: '0.3rem 1rem',
						height: 40,
						fontSize: themeFontSize('1.1rem'),
						username: {
							fontWeight: 700
						},
						time: {
							fontSize: themeFontSize('1.1rem'),
							padding: '0rem 0 0 0.5rem'
						}
					}),


					body: makeStyle(FlexColumn,FlexAuto,{
						padding: '1rem',

					}),

					commentor: makeStyle({
						padding: '0rem'
					})
				})
			})
		}),
	}),

	/**
	 * PANEL FOOTER
	 */
	footer: makeStyle(flexTransition,FlexAuto,{

	}),

	markdown: makeStyle({
		padding: '1rem',
		overflowY: 'visible',
		height: 'auto',

		'pre': {
			width: '100%',
			boxSizing: 'border-box'
		}
	})

}
//endregion


function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)

	return {
		theme: appState.theme,
		issues: repoState.selectedIssues,
		repos: repoState.repos,
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
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

	refs:{[name:string]:any}

	constructor(props:any) {
		super(props)

	}



	renderMulti(issues:Issue[],s) {
		return <div>
			{issues.length} selected issues
		</div>
	}

	renderHeader(issue,repos,s) {
		const {header} = s,
			{row1,row2,row3} = header,
			repo = repos.find(repo => repo.id === issue.repoId)


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
				        avatarStyle={s.avatar} />


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

	renderFooter(issue,s) {
		return <div style={s.footer}>
			<div >
				add comment here
			</div>
		</div>
	}

	renderBody(issue,s) {
		return (issue.body) ? <div style={s.content.body}>
			<Markdown source={issue.body}/>
		</div> : <div/>
	}


	// COMMENT
	renderComment(issue,comment,s) {
		const
			{activity} = s.content.activities,
			{comment:commentStyle} = activity,
			timeStyle = makeStyle(s.time,commentStyle.details.time)

		log.info(`Rendering comment`,comment)
		return <div style={activity}  key={comment.id}>
			{/* COMMENTOR AVATAR*/}
			<Avatar user={comment.user}
			        style={activity.user}
			        labelPlacement='none'
			        avatarStyle={makeStyle(s.avatar,activity.avatar)} />

			<div style={commentStyle}>
				<div style={commentStyle.details}>
					<div style={commentStyle.details.username}>{comment.user.login}</div>
					<div style={timeStyle}>commented {moment(comment.created_at).fromNow()}</div>
					{comment.created_at !== comment.updated_at &&
						<div style={timeStyle}>updated {moment(comment.updated_at).fromNow()}</div>}
				</div>
				<Markdown className={`markdown issue-${issue.id}`}  style={commentStyle.body} source={comment.body}/>

			</div>
		</div>
	}

	renderActivities(issue,comments,s) {
		comments = comments || []

		const
			{content} = s,
			{activities} = content,
			{activity} = activities

		return <div style={activities}>
			{comments.map(comment => this.renderComment(issue,comment,s))}
		</div>
	}

	renderIssue(issue:Issue,comments:Comment[],repos,s) {
		const {content} = s

		return <div style={s.issue}>
			<Style
				scopeSelector={`.markdown.issue-${issue.id}`}
			    rules={s.markdown}
			/>
			{this.renderHeader(issue,repos,s)}

			{/* Issue Detail Body */}
			<div style={content}>
				<div style={content.wrapper}>

					{this.renderBody(issue,s)}
					{this.renderActivities(issue,comments,s)}
				</div>
			</div>
			{this.renderFooter(issue,s)}
		</div>
	}

	render() {
		const
			{issues,theme,repos,comments} = this.props,
			s = mergeStyles(styles,theme.issueDetail)

		return <div style={s.root}>
			{issues.length === 0 ? <div/> :
				issues.length > 1 ?
					this.renderMulti(issues,s) :
					this.renderIssue(issues[0],comments,repos,s)
			}
		</div>
	}

}