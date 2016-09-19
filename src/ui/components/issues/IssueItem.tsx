


// Imports
import * as moment from 'moment'
import * as React from 'react'

import {PureRender, Renderers, Avatar} from '../common'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import {IssueLabelsAndMilestones} from './IssueLabelsAndMilestones'
import {Issue} from 'shared/models'

import { IIssueGroup, IIssueListItem } from 'shared/actions/issue/IIssueListItems'
import { selectedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import {createSelector} from 'reselect'
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'


interface IIssueItemProps extends React.HTMLAttributes<any> {
	styles:any
	item:IIssueListItem<Issue>
	onSelected:(event:any, issue:Issue) => void
	isSelected?:boolean
	isSelectedMulti?:boolean
}

// State is connected at the item level to minimize redraws for the whole issue list
@connect(createSelector(
	selectedIssueIdsSelector,
	(state,props:IIssueItemProps):IIssueListItem<Issue> => props.item,
	(selectedIssueIds:number[],item:IIssueListItem<Issue>) => {
		const
			isSelected =
				item &&
				selectedIssueIds &&
				selectedIssueIds.includes((item.item as Issue).id)
		
		return {
			isSelected,
			item,
			isSelectedMulti: isSelected && selectedIssueIds.length > 1
		}
	}
))

class IssueItem extends React.Component<IIssueItemProps,void> {
	
	shouldComponentUpdate(nextProps:IIssueItemProps) {
		return (
			this.props.isSelected !== nextProps.isSelected ||
			this.props.isSelectedMulti !== nextProps.isSelectedMulti ||
			_.get(this.props.item,'id',null) !== _.get(nextProps.item,'id',null)
		)
	}
	
	render() {
		const
			{props} = this,
			{styles,onSelected,item,isSelected,isSelectedMulti} = props
			
			
		if (!item)
			return React.DOM.noscript()

		const
			issue = item.item,
			{labels} = issue,
			issueStyles = makeStyle(
				styles.issue,
				isSelected && styles.issue.selected,
				(isSelectedMulti) && styles.issue.multi,
				props.style
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				isSelected && styles.issueTitleSelected,
				isSelectedMulti && styles.issueTitleSelectedMulti
			)

		return <div {...filterProps(props)} id={`issue-item-${issue.id}`}
		                                    style={issueStyles}
		                                    className={'animated fadeIn ' + (isSelected ? 'selected' : '')}
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
					<div style={styles.issueLabels.wrapper}>
						<IssueLabelsAndMilestones
							showIcon
							labels={labels}
							milestones={issue.milestone ? [issue.milestone] : []}
							style={styles.issueLabels}
							labelStyle={styles.issueLabels.label}
						/>
					</div>
					


					<IssueStateIcon styles={[{root:{marginLeft:rem(0.5)}}]} state={issue.state}/>
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