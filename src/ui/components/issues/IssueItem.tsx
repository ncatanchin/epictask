


// Imports
import * as moment from 'moment'
import * as React from 'react'

import {PureRender, Renderers, Avatar} from '../common'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {Issue} from 'shared/models'
import filterProps from 'react-valid-props'

import {IIssueGroup} from 'shared/actions/issue/IIssueGroup'
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'
import { selectedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"


interface IIssueItemProps extends React.DOMAttributes {
	styles:any
	onSelected:(event:any, issue:Issue) => void
	//issue?:Issue
	index:number
	issues:Issue[]
	issuesGrouped?:IIssueGroup[]
	groupBy:string
	selectedIssueIds?:number[]
}


@connect(createStructuredSelector({
	selectedIssueIds: selectedIssueIdsSelector
},createDeepEqualSelector))
@PureRender
class IssueItem extends React.Component<IIssueItemProps,void> {


	
	render() {
		const
			{props} = this,
			{styles,onSelected,issues,index,selectedIssueIds} = props,
			issue = issues && issues[index],
			selected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id),
			selectedMulti = selectedIssueIds.length > 1
			
			
		if (!issue)
			return React.DOM.noscript()

		const
			{labels} = issue,

			issueStyles = makeStyle(
				styles.issue,
				selected && styles.issue.selected,
				(selected && selectedMulti) && styles.issue.multi
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				selected && styles.issueTitleSelected,
				selectedMulti && styles.issueTitleSelectedMulti
			)

		return <div {...filterProps(props)} id={`issue-item-${issue.id}`}
		                                    style={issueStyles}
		                                    className={'animated fadeIn ' + (selected ? 'selected' : '')}
		                                    onClick={(event) => onSelected(event,issue)}>

			{/*<div style={styles.issueMarkers}></div>*/}
			<div style={styles.issueDetails}>

				<div style={styles.issueRepoRow}>
					<div style={styles.issueRepo}>
						<span style={styles.issueNumber}>
							#{issue.number}&nbsp;&nbsp;
						</span>
						<Renderers.RepoName repo={issue.repo} style={styles.issueRepo}/>
						
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


					<IssueStateIcon state={issue.state}/>
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