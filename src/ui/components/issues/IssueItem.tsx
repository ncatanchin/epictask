


// Imports
import * as moment from 'moment'
import * as React from 'react'
import {List} from 'immutable'
import {Renderers, Avatar} from 'ui/components/common'
import {connect} from 'react-redux'
import filterProps from 'react-valid-props'
import { IssueLabelsAndMilestones, IssuesPanel } from 'ui/components/issues'
import {Issue} from 'shared/models'

import { issuesSelector, focusedIssueIdsSelector } from "shared/actions/issue/IssueSelectors"
import {createSelector} from 'reselect'
import {IssueStateIcon} from 'ui/components/issues/IssueStateIcon'

import { shallowEquals, getValue } from "shared/util"
import { ThemedStyles, IThemedAttributes } from "shared/themes/ThemeDecorations"
import {createStructuredSelector} from 'reselect'

import baseStyles from './IssueItem.styles'

const
	log = getLogger(__filename)

/**
 * Issue items
 */
export interface IIssueItemProps extends IThemedAttributes {
	
	issueId:number
	
	onOpen?:(event:any, issue:Issue) => void
	onSelected:(event:any, issue:Issue) => void
	issue?:Issue
	
	isFocused?:boolean
}

/**
 * Issue item state
 */
export interface IIssueItemState {
	isSelected?:boolean
	isSelectedMulti?:boolean
}

// State is connected at the item level to minimize redraws for the whole issue list
@connect(() => {
	const
		issueSelector = createSelector(
			issuesSelector,
			(state, props:IIssueItemProps) => props.issueId,
			(issues:List<Issue>, issueId:number):Issue => {
				return issues.find(issue => issue.id === issueId)
			}
		),
		isFocusedSelector = createSelector(
			issueSelector,
			focusedIssueIdsSelector,
			(issue:Issue, focusedIssueIds:number[]) =>
			issue &&
			focusedIssueIds &&
			focusedIssueIds.includes(issue.id)
		)
		
		
		return createStructuredSelector({
		issue: issueSelector,
		isFocused: isFocusedSelector
	})
})

@ThemedStyles(baseStyles,'issueItem')
class IssueItem extends React.Component<IIssueItemProps,IIssueItemState> {
	
	static contextTypes = {
		issuesPanel:React.PropTypes.object
	}
	
	/**
	 * Get issues panel from context
	 *
	 * @returns {IssuesPanel}
	 */
	private get issuesPanel() {
		return getValue(() => (this.context as any).issuesPanel) as IssuesPanel
	}
	
	/**
	 * Update the state from the issue panel
	 */
	private updateState = () => {
		const
			issuesPanel = this.issuesPanel
		
		if (issuesPanel) {
			const
				{
					issue
				} = this.props,
				
				{
					selectedIssueIds
				} = issuesPanel,
				
				isSelected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id),
			
				newState = {
					isSelected,
					isSelectedMulti: isSelected && selectedIssueIds.length > 1
				}
				
			if (!shallowEquals(newState,this.state))
				this.setState(newState)
		}
	}
	
	
	/**
	 * On mount attach to issues panel
	 */
	componentWillMount() {
		const
			{issuesPanel} = this
		
		issuesPanel.addSelectListener(this.updateState)
		
		this.updateState()
		
	}
	
	/**
	 * on unmount - detach
	 */
	componentWillUnmount() {
		const
			{issuesPanel} = this
		
		issuesPanel.removeSelectListener(this.updateState)
	}
	
	/**
	 * Checks whether the item should update comparing
	 * selected, selectedMulti and item ref
	 *
	 * @param nextProps
	 * @returns {boolean}
	 * @param nextState
	 */
	shouldComponentUpdate(nextProps:IIssueItemProps,nextState:IIssueItemState) {
		return !shallowEquals(
			nextProps,
			this.props,
			'isFocused',
			'issue.id',
			'issue.labels',
			'issue.milestone',
			'issue.updated_at'
		) || !shallowEquals(
				nextState,
				this.state,
				'isSelected',
				'isSelectedMulti'
			)
	}
	
	/**
	 * Render the item
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{props,state} = this,
			{
				style:styleParam,
				styles,
				issue,
				onOpen,
				isFocused,
				onSelected
			} = props,
			{
				
				isSelected,
				isSelectedMulti
			} = state
			
			
		if (!issue)
			return React.DOM.noscript()

		const
			{labels} = issue,
			
			issueStyles = makeStyle(
				styles,
				isFocused && styles.focused,
				isSelected && styles.selected,
				(isSelectedMulti) && styles.multi,
				styleParam // PARAM PASSED FROM LIST
			),
			issueTitleStyle = makeStyle(
				styles.title,
				isFocused && styles.title.focused,
				isSelected && styles.title.selected,
				isSelectedMulti && styles.title.selected.multi
			)

		return <div {...filterProps(props)} id={`issue-item-${issue.id}`}
		                                    style={issueStyles}
		                                    className={(isSelected ? 'selected' : '')}
		                                    onDoubleClick={event => onOpen && onOpen(event,issue)}
		                                    onClick={(event) => onSelected(event,issue)}>

			{/*<div style={stylesMarkers}></div>*/}
			<div style={styles.details}>

				<div style={styles.row1}>
					<div style={styles.repo}>
						<span style={[
							styles.number,
							isFocused && styles.number.focused,
							isSelected && styles.number.selected
						]}>
							#{issue.number}&nbsp;&nbsp;
						</span>
						<Renderers.RepoName repo={issue.repo} style={
							makeStyle(
								styles.repo,
								isFocused && styles.repo.focused,
								isSelected && styles.repo.selected
							)}/>
						
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.row2}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={styles.time}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={styles.row3}>

					{/* LABELS */}
					<div style={styles.labels.wrapper}>
						<IssueLabelsAndMilestones
							showIcon
							labels={labels}
							milestones={issue.milestone ? [issue.milestone] : []}
							style={styles.labels}
							labelStyle={styles.labels.label}
						/>
					</div>
					


					<IssueStateIcon styles={[styles.state]}
					                issue={issue}/>
					
				</div>
			</div>
			
			{/* FOCUSED MARKING BAR */}
			<div style={[
				styles.bar,
				isSelected && styles.selected.bar,
				isFocused && styles.focused.bar
			]}/>
			
		</div>

	}
}

export default IssueItem