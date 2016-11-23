// Imports
import { Renderers, Avatar, IssueLabelsAndMilestones, IssueStateIcon } from "epic-ui-components"
import filterProps from "react-valid-props"
import { Issue } from "epic-models"
import { shallowEquals, getValue } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import baseStyles from "./IssueItem.styles"
import { IRowState } from "epic-ui-components/common/VisibleList"
import { IIssueListItem, isIssueListItem } from "epic-typedux/state/issue/IIssueListItems"
import { guard } from "epic-global/ObjectUtil"
import IssuesPanelController from "epic-ui-components/pages/issues-panel/IssuesPanelController"
import { connect } from "react-redux"
import { createSelector, createStructuredSelector } from 'reselect'
import { List } from 'immutable'
import { getIssuesPanelSelector } from "epic-ui-components/pages/issues-panel/IssuesPanelController"

const
	log = getLogger(__filename)

/**
 * Issue items
 */
export interface IIssueItemProps extends IThemedAttributes {
	
	
	viewController?:IssuesPanelController
	onOpen?:(event:any, issue:Issue) => void
	onSelected:(event:any, issue:Issue) => void
	
	rowState?:IRowState<string,string,number>
	
	isSelected?:boolean
	isSelectedMulti?:boolean
	
	isFocused?:boolean
	
	issue?:Issue
	realIndex?:number
	item?:IIssueListItem<any>
	
}


// State is connected at the item level to minimize redraws for the whole issue list
@connect(() => {
	const
		realIndexSelector = (state, props:IIssueItemProps) => props.rowState.item,
		
		itemSelector = createSelector(
			realIndexSelector,
			getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
			(realIndex:number, items:List<IIssueListItem<any>>) => items.get(realIndex)
		),
		
		issueSelector = createSelector(
			itemSelector,
			(item:IIssueListItem<any>) => item && isIssueListItem(item) && item.item
		),
		
		isFocusedSelector = createSelector(
			issueSelector,
			getIssuesPanelSelector(selectors => selectors.focusedIssueIdsSelector),
			(issue:Issue, focusedIssueIds:List<number>) =>
			issue && focusedIssueIds && focusedIssueIds.includes(issue.id)
		),
		isSelectedSelector = createSelector(
			issueSelector,
			getIssuesPanelSelector(selectors => selectors.selectedIssueIdsSelector),
			(issue:Issue, selectedIssueIds:List<number>):boolean =>
			issue && selectedIssueIds.includes(issue.id)
		),
		isSelectedMultiSelector = createSelector(
			issueSelector,
			getIssuesPanelSelector(selectors => selectors.selectedIssueIdsSelector),
			(issue:Issue, selectedIssueIds:List<number>):boolean =>
			issue && selectedIssueIds.includes(issue.id) && selectedIssueIds.size > 0
		)
	
	
	return createStructuredSelector({
		realIndex: realIndexSelector,
		item: itemSelector,
		issue: issueSelector,
		
		isFocused: isFocusedSelector,
		isSelected: isSelectedSelector,
		isSelectedMulti: isSelectedMultiSelector
	})
})

@ThemedStyles(baseStyles, 'issueItem')
export class IssueItem extends React.Component<IIssueItemProps,void> {
	
	constructor(props, context) {
		super(props, context)
	}
	
	/**
	 * Get the item's issue
	 */
	private get issue():Issue {
		return this.props.issue
	}
	
	/**
	 * Checks whether the item should update comparing
	 * selected, selectedMulti and item ref
	 *
	 * @param nextProps
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssueItemProps) {
		return !shallowEquals(
			nextProps,
			this.props,
			'rowState',
			'style',
			'styles',
			'theme',
			'palette',
			'issue',
			'isFocused',
			'isSelected',
			'isSelectedMulti'
		)
	}
	
	
	private onDoubleClick = (event) => {
		guard(() => this.props.onOpen(event, this.issue))
		
	}
	
	private onClick = (event) => {
		guard(() => this.props.onSelected(event, this.issue))
	}
	
	/**
	 * Render the item
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{ props, state } = this,
			{
				style:styleParam,
				styles,
				onOpen,
				onSelected,
				rowState,
				issue,
				isFocused,
				isSelected,
				isSelectedMulti
			} = props
		
		
		if (!issue)
			return React.DOM.noscript()
		
		const
			{ labels } = issue,
			
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
				
				{/* ASSIGNEE */}
				<IssueItemAvatarAndState styles={styles} issue={issue}/>
				<div style={styles.content}>
					
					
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
						
						
						
						{/* LAST UPDATED */}
						<div style={styles.time}>{moment(issue.updated_at).fromNow()}</div>
						
					</div>
					
					
					<div style={styles.row2}>
						<div style={issueTitleStyle}>{issue.title}</div>
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
					
					
					</div>
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


function IssueItemAvatarAndState({styles,issue}) {
	return <div style={styles.avatarAndState}>
		
		<Avatar user={issue.assignee}
		        style={styles.avatar}
		        labelStyle={styles.username}
		        avatarStyle={styles.avatar}/>
		
		{/* IF CLOSED, SHOW CHECK */}
		{issue.state === 'closed' && <IssueStateIcon styles={[styles.state]}
		                                             issue={issue}/> }
	
	
	</div>
}

export default IssueItem