


// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'

import {PureRender, Renderers, Avatar} from '../common'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'

import {Issue, Repo} from 'shared/models'
import {DataKey} from 'shared/Constants'
import {createStructuredSelector} from 'reselect'
import filterProps from 'react-valid-props'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'
import {IIssueGroup} from 'shared/actions/issue/IIssueGroup'


interface IIssueItemProps extends React.DOMAttributes {
	index:number
	styles:any
	onSelected:(event:any, issue:Issue) => void
	issues:Issue[]
	issuesGrouped?:IIssueGroup[]
	repoId?:number
	repo?:Repo
	groupBy:string
	selectedIssueIds?:number[]
}

interface IIssueState {
	issue?:Issue
	selected?:boolean
	selectedMulti?:boolean
}



@PureRender
class IssueItem extends React.Component<IIssueItemProps,IIssueState> {


	getNewState(props:IIssueItemProps) {
		//const repoState = repoActions.state

		const
			{index,issues,issuesGrouped,groupBy,selectedIssueIds} = props


		const
			issue = issues[index],
			selected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id),
			selectedMulti = selectedIssueIds.length > 1


		return {
			issue,selected,selectedMulti
		}
	}

	componentWillMount() {
		this.setState(this.getNewState(this.props))
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	render() {
		const
			{props,state} = this,
			{issue, selectedMulti, selected} = state,
			{styles,onSelected,repo} = props

		if (!issue)
			return <div/>

		const
			{labels} = issue,

			issueStyles = makeStyle(
				styles.issue,
				selected && styles.issue.selected,
				(selected && selectedMulti) && styles.issueSelectedMulti
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				selected && styles.issueTitleSelected,
				selectedMulti && styles.issueTitleSelectedMulti
			)

		//selected={selected}
		return <div {...filterProps(props)} style={issueStyles}
		                                    className={'animated fadeIn ' + (selected ? 'selected' : '')}
		                                    onClick={(event) => onSelected(event,issue)}>

			{/*<div style={styles.issueMarkers}></div>*/}
			<div style={styles.issueDetails}>

				<div style={styles.issueRepoRow}>
					<div style={styles.issueRepo}>
						{Renderers.repoName(issue.repo)}
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.issue.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.issueTitleRow}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={styles.issueBottomRow}>

					{/* LABELS */}
					<IssueLabelsAndMilestones
						showIcon
						labels={labels}
						milestones={issue.milestone ? [issue.milestone] : []}
						style={styles.issueLabels}
					    labelStyle={styles.issueLabels.label}
					/>

					{/*/!* MILESTONE *!/*/}
					{/*{issue.milestone && <div style={styles.issueMilestone}>*/}
						{/*{issue.milestone.title}*/}
					{/*</div>}*/}
				</div>
			</div>
		</div>

	}
}

export default IssueItem