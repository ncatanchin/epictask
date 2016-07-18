


// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'

import {PureRender, Renderers, Avatar} from '../common'
import {IssueLabels} from './IssueLabels'

import {Issue, Repo} from 'shared/models'
import {DataKey} from 'shared/Constants'
import {createStructuredSelector} from 'reselect'
import filterProps from 'react-valid-props'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'



interface IIssueItemProps extends React.DOMAttributes {
	index:number
	styles:any
	onSelected:(event:any, issue:Issue) => void
	issues:Issue[]
	repoId?:number
	repo?:Repo
	selectedIssueIds?:number[]
}

interface IIssueState {
	issue?:Issue
	selected?:boolean
	selectedMulti?:boolean
}



/**
 * Create a new issue item to state => props mapper
 *
 * @returns {any}
 */
const makeIssueItemStateToProps = () => {
	return createStructuredSelector({
		repo: (state,{issues,index}) => {
			let issue,repo = null
			if (issues && (issue = issues[index])) {
				const {repoId} = issue
				repo = state.get(DataKey).models.get(Repo.$$clazz).get(`${repoId}`)
			}
			return repo
		},
		selectedIssueIds: selectedIssueIdsSelector
	},createDeepEqualSelector)
}

@connect(makeIssueItemStateToProps)
@PureRender
class IssueItem extends React.Component<IIssueItemProps,IIssueState> {


	getNewState(props:IIssueItemProps) {
		//const repoState = repoActions.state

		const
			{index,issues,selectedIssueIds} = props

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
				selected && styles.issueSelected,
				(selected && selectedMulti) && styles.issueSelectedMulti
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				selected && styles.issueTitleSelected,
				selectedMulti && styles.issueTitleSelectedMulti
			)

		return <div {...filterProps(props)} style={issueStyles}
		                                    selected={selected}
		                                    className={'animated fadeIn ' + (selected ? 'selected' : '')}
		                                    onClick={(event) => onSelected(event,issue)}>

			<div style={styles.issueMarkers}></div>
			<div style={styles.issueDetails}>

				<div style={styles.issueRepoRow}>
					<div style={styles.issueRepo}>
						{Renderers.repoName(repo)}
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
					<IssueLabels labels={labels} style={styles.issueLabels}/>

					{/* MILESTONE */}
					{issue.milestone && <div style={styles.issueMilestone}>
						{issue.milestone.title}
					</div>}
				</div>
			</div>
		</div>

	}
}

export default IssueItem