// Imports
import { Avatar, IssueLabelsAndMilestones, IssueStateIcon } from "epic-ui-components"
import filterProps from "react-valid-props"
import { Issue, User } from "epic-models"
import { shallowEquals, getValue } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import baseStyles from "./IssueItem.styles"
import { IRowState } from "epic-ui-components/common/VisibleList"
import { IIssueListItem, isIssueListItem } from "epic-models"
import { guard } from "epic-global/ObjectUtil"
import IssuesPanelController from "./IssuesPanelController"
import { connect } from "react-redux"
import { createSelector, createStructuredSelector } from 'reselect'
import { List } from 'immutable'
import { getIssuesPanelSelector } from "./IssuesPanelController"
import { TimeAgo, LabelChip, MilestoneLabel, RepoLabel } from "epic-ui-components/common"
import { Icon } from "epic-ui-components/common/icon/Icon"

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
				isSelected,
				isSelectedMulti
			} = props
		
		
		if (!issue)
			return React.DOM.noscript()
		
		const
			isFocused = issue.focused,
			
			issueStyles = makeStyle(
				styles,
				isFocused && styles.focused,
				isSelected && styles.selected,
				(isSelectedMulti) && styles.multi,
				styleParam,
				rowState.style// PARAM PASSED FROM LIST
			),
			specialStyle = isSelected ? 'selected' : isFocused ? 'focused' : -1,
			issueTitleStyle = makeStyle(
				styles.title,
				styles.title[specialStyle],
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
				<IssueItemAvatar
					styles={styles}
					issue={issue}
					specialStyle={specialStyle}/>
				
				
				<div style={styles.content}>
					
					
					<div style={styles.row1}>
						
						{/* IF CLOSED, SHOW CHECK OR IF MILESTONED*/}
						{issue.state === 'closed' &&
							<IssueStateIcon styles={[styles.markings.state]}
							                iconName="check"
							                issue={issue}/>}
						
						<div style={styles.repo}>
						<span style={[
							styles.number,
							isFocused && styles.number.focused,
							isSelected && styles.number.selected
						]}>
							#{issue.number}&nbsp;&nbsp;
						</span>
							
							
							<RepoLabel repo={issue.repo} style={makeStyle(
								styles.repo,
								isFocused && styles.repo.focused,
								isSelected && styles.repo.selected
							)}/>
						
						</div>
					</div>
					
					
					<div style={styles.row2}>
						<div style={issueTitleStyle}>{issue.title}</div>
						{
							getValue(() => issue.labels.length,0) > 0 &&
								<div style={styles.labels}>
									{issue.labels.map(label =>
										<LabelChip
											key={label.id}
											label={label}
											labelStyle={styles.labels.label}
											mode='dot' />)}
								</div>
						}
					</div>
					
				
				</div>
				
				<IssueItemMarkings
					styles={styles}
					issue={issue}
					specialStyle={specialStyle}/>
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

/**
 * Item markings
 *
 * @param styles
 * @param issue
 * @param specialStyle
 * @returns {any}
 * @constructor
 */
function IssueItemMarkings({styles,issue,specialStyle}) {
	const
		{
			markings: markingsStyle,
			milestone: milestoneStyle
		} = styles
		
	return <div style={markingsStyle}>
		<TimeAgo
			style={makeStyle(styles.time,styles.time[specialStyle])}
			timestamp={issue.created_at as any}/>
		
		
		{
			issue.milestone && <MilestoneLabel
				milestone={issue.milestone}
				style={milestoneStyle}
				iconStyle={[
					styles.milestone.icon,
					styles.milestone[specialStyle]
				]}
				textStyle={[
					styles.milestone.text,
					styles.milestone[specialStyle]
				]}
			/>
		}
		
	</div>
}

/**
 * Avatar and state
 *
 * @param styles
 * @param issue
 * @returns {any}
 * @constructor
 * @param specialStyle
 */
function IssueItemAvatar({ styles, issue,specialStyle }) {
	const
		{ avatarAndState: avatarAndStateStyle} = styles,
		{ avatar: avatarStyle} = avatarAndStateStyle
	
	return <div style={avatarAndStateStyle}>
		
		
		<Avatar user={issue.assignee || User.UnknownUser}
		        style={makeStyle(avatarStyle,avatarStyle.root)}
		        avatarStyle={makeStyle(avatarStyle,avatarStyle.image)}/>
	
	
	</div>
}

export default IssueItem