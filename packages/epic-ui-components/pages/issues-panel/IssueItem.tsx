// Imports
import { List } from "immutable"

import { Renderers, Avatar, IssueLabelsAndMilestones, IssueStateIcon } from "epic-ui-components"
import { connect } from "react-redux"
import filterProps from "react-valid-props"
import { IssuesPanel } from "./IssuesPanel"
import { Issue } from "epic-models"
import { issuesSelector, focusedIssueIdsSelector } from "epic-typedux"
import { createSelector, createStructuredSelector } from "reselect"
import { shallowEquals, getValue } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import baseStyles from "./IssueItem.styles"
import { IRowState } from "epic-ui-components/common/VisibleList"
import { IIssueListItem, isIssueListItem } from "epic-typedux/state/issue/IIssueListItems"
import { guard } from "epic-global/ObjectUtil"

const
	log = getLogger(__filename)

/**
 * Issue items
 */
export interface IIssueItemProps extends IThemedAttributes {
	
	
	
	onOpen?:(event:any, issue:Issue) => void
	onSelected:(event:any, issue:Issue) => void
	
	rowState?:IRowState<string,string,number>
	
}

/**
 * Issue item state
 */
export interface IIssueItemState {
	isSelected?:boolean
	isSelectedMulti?:boolean
	
	issueId?:number
	
	isFocused?:boolean
	
	issue?:Issue
	realIndex?:number
	item?:IIssueListItem<any>
	
}

// State is connected at the item level to minimize redraws for the whole issue list
// @connect(() => {
// 	const
// 		issueSelector = createSelector(
// 			issuesSelector,
// 			(state, props:IIssueItemProps) => props.issueId,
// 			(issues:List<Issue>, issueId:number):Issue => {
// 				return issues.find(issue => issue.id === issueId)
// 			}
// 		),
// 		isFocusedSelector = createSelector(
// 			issueSelector,
// 			focusedIssueIdsSelector,
// 			(issue:Issue, focusedIssueIds:number[]) =>
// 			issue &&
// 			focusedIssueIds &&
// 			focusedIssueIds.includes(issue.id)
// 		)
//
//
// 		return createStructuredSelector({
// 		issue: issueSelector,
// 		isFocused: isFocusedSelector
// 	})
// })

@ThemedStyles(baseStyles,'issueItem')
export class IssueItem extends React.Component<IIssueItemProps,IIssueItemState> {
	
	static contextTypes = {
		issuesPanel:React.PropTypes.object
	}
	
	constructor(props,context) {
		super(props,context)
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
	private updateState = (props = this.props) => {
		const
			issuesPanel = this.issuesPanel
		
			
		if (issuesPanel) {
			
			const
				{rowState} = props,
				realIndex:number = rowState.item,
				panel = this.issuesPanel,
				item = panel.getItem(realIndex),
				issue = item && isIssueListItem(item) && item.item,
				issueId = issue && issue.id,
				{selectedIssueIds} = issuesPanel,
				
				isSelected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id),
			
				newState = {
					item,
					realIndex,
					issue,
					issueId,
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
			'rowState',
			'style',
			'issue.id',
			'issue.labels',
			'issue.milestone',
			'issue.updated_at'
		) || !shallowEquals(
				nextState,
				this.state,
				'isFocused',
				'isSelected',
				'isSelectedMulti'
			)
	}
	
	
	private onDoubleClick = (event) => {
		guard(() => this.props.onOpen(event,this.state.issue))
		
	}
	
	private onClick = (event) => {
		guard(() => this.props.onSelected(event,this.state.issue))
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
				onOpen,
				onSelected,
				rowState
			} = props,
			{
				issue,
				isFocused,
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
				styleParam,
				rowState.style// PARAM PASSED FROM LIST
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
		                                    onDoubleClick={this.onDoubleClick}
		                                    onClick={this.onClick}>

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