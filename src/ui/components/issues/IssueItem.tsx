


// Imports
import * as moment from 'moment'

import {List} from 'immutable'
import {Renderers, Avatar} from 'ui/components/common'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import {IssueLabelsAndMilestones} from 'ui/components/issues'
import {Issue} from 'shared/models'

import { selectedIssueIdsSelector, issuesSelector } from "shared/actions/issue/IssueSelectors"
import {createSelector} from 'reselect'
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'

import { shallowEquals } from "shared/util/ObjectUtil"
import { createDeepEqualSelector } from "shared/util/SelectorUtil"
import { Themed } from "shared/themes/ThemeManager"


interface IIssueItemProps extends React.HTMLAttributes<any> {
	theme?:any
	styles:any
	issueId:number
	issue?:Issue
	onSelected:(event:any, issue:Issue) => void
	isSelected?:boolean
	isSelectedMulti?:boolean
}

// State is connected at the item level to minimize redraws for the whole issue list
@connect(() => {
	const
		issueSelector = createSelector(
			issuesSelector,
			(state,props:IIssueItemProps) => props.issueId,
			(issues:List<Issue>,issueId:number):Issue => {
				return issues.find(issue => issue.id === issueId)
			}
		)
	return createDeepEqualSelector(
		selectedIssueIdsSelector,
		issueSelector,
		(selectedIssueIds:number[],issue:Issue) => {
			const
				isSelected =
					issue &&
					selectedIssueIds &&
					selectedIssueIds.includes(issue.id)
			
			return {
				isSelected,
				issue,
				isSelectedMulti: isSelected && selectedIssueIds.length > 1
			}
		}
	)
})
class IssueItem extends React.Component<IIssueItemProps,void> {
	
	/**
	 * Checks whether the item should update comparing
	 * selected, selectedMulti and item ref
	 *
	 * @param nextProps
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssueItemProps) {
		return !shallowEquals(nextProps,this.props,'isSelected','isSelectedMulti','issue.id','theme','styles')
	}
	
	render() {
		
		const
			{props} = this,
			{styles,onSelected,issue,isSelected,isSelectedMulti} = props
			
			
		if (!issue)
			return React.DOM.noscript()

		const
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
		                                    className={(isSelected ? 'selected' : '')}
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