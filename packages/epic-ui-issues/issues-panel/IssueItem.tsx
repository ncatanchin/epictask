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
import { isHovering } from "epic-styles/styles"

const
	log = getLogger(__filename)

/**
 * Issue items
 */
export interface IIssueItemProps extends IThemedAttributes {
	
	
	viewController?: IssuesPanelController
	onOpen?: (event: any, issue: Issue) => void
	onSelected: (event: any, issue: Issue) => void
	
	rowState?: IRowState<string,string,number>
	
	isSelected?: boolean
	isSelectedMulti?: boolean
	
	isFocused?: boolean
	
	issue?: Issue
	realIndex?: number
	item?: IIssueListItem<any>
	
}


// State is connected at the item level to minimize redraws for the whole issue list
@connect(() => {
	const
		realIndexSelector = (state, props: IIssueItemProps) => props.rowState.item,
		
		itemSelector = createSelector(
			realIndexSelector,
			getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
			(realIndex: number, items: List<IIssueListItem<any>>) => items.get(realIndex)
		),
		
		issueSelector = createSelector(
			itemSelector,
			(item: IIssueListItem<any>) => item && isIssueListItem(item) && item.item
		),
		
		isSelectedSelector = createSelector(
			issueSelector,
			getIssuesPanelSelector(selectors => selectors.selectedIssueIdsSelector),
			(issue: Issue, selectedIssueIds: List<number>): boolean =>
			issue && selectedIssueIds.includes(issue.id)
		),
		isSelectedMultiSelector = createSelector(
			issueSelector,
			getIssuesPanelSelector(selectors => selectors.selectedIssueIdsSelector),
			(issue: Issue, selectedIssueIds: List<number>): boolean =>
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
export class IssueItem extends React.Component<IIssueItemProps,any> {
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {}
	}
	
	/**
	 * Get the item's issue
	 */
	private get issue(): Issue {
		return this.props.issue
	}
	
	/**
	 * Checks whether the item should update comparing
	 * selected, selectedMulti and item ref
	 *
	 * @param nextProps
	 * @param nextState
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps: IIssueItemProps,nextState) {
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
		) || !shallowEquals(nextState,this.state)
	}
	
	
	private onDoubleClick = (event) => {
		guard(() => this.props.onOpen(event, this.issue))
		
	}
	
	private onClick = (event) => {
		guard(() => this.props.onSelected(event, this.issue))
	}
	
	private onContextMenu = (event) => {
		const
			{ issue } = this
		
		log.info(`Context Menu for issue`, issue)
		this.props.viewController.showIssueContextMenu(issue)
		
	}
	
	
	/**
	 * Render the item
	 *
	 * @returns {any}
	 */
	render() {
		
		const
			{ props } = this,
			{
				style:styleParam,
				styles,
				rowState,
				issue,
				isSelected,
				isSelectedMulti
			} = props
		
		
		if (!issue)
			return React.DOM.noscript()
		
		const
			itemId = `issue-item-${issue.id}`,
			
			isFocused = issue.focused,
			
			issueStyles = makeStyle(
				styles,
				isFocused && styles.focused,
				isSelected && styles.selected,
				(isSelectedMulti) && styles.multi,
				styleParam,
				rowState.style// PARAM PASSED FROM LIST
			),
			
			hovering = isHovering(this,'itemRoot'),
			
			specialStyle = isSelected ? 'selected' : isFocused ? 'focused' : -1,
			
			issueTitleStyle = makeStyle(
				styles.title,
				styles.title[ specialStyle ],
				isSelectedMulti && styles.title.selected.multi
			)
		
		return <div
			{...filterProps(props)}
			id={itemId}
			ref='itemRoot'
      style={issueStyles}
      className={(isSelected ? 'selected' : '')}
      onContextMenu={this.onContextMenu}
      onDoubleClick={this.onDoubleClick}
      onClick={this.onClick}
		>
			
			
			<div style={styles.details}>
				
				
				{/* ASSIGNEE */}
				<IssueItemAvatar
					styles={styles}
					issue={issue}
					highlight={isFocused || isSelected || hovering}
					specialStyle={specialStyle}
				/>
				
				
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
							
							<TimeAgo
								style={makeStyle(styles.time,styles.time[specialStyle])}
								timestamp={issue.created_at as any}/>
						
						
						</div>
					</div>
					
					
					<div style={styles.row2}>
						<div style={issueTitleStyle}>{issue.title}</div>
						{
							getValue(() => issue.labels.length, 0) > 0 &&
							<div style={styles.labels}>
								
								{/* LABELS */}
								{issue.labels.map(label =>
									<LabelChip
										key={label.id}
										label={label}
										labelStyle={styles.labels.label}
										mode='dot'/>)}
								
								{
									issue.milestone && <MilestoneLabel
										milestone={issue.milestone}
										style={styles.milestone}
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
					</div>
				
				
				</div>
				
				{/*<IssueItemMarkings*/}
				{/*styles={styles}*/}
				{/*issue={issue}*/}
				{/*specialStyle={specialStyle}/>*/}
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
function IssueItemMarkings({ styles, issue, specialStyle }) {
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
function IssueItemAvatar({ styles, issue, highlight, specialStyle }) {
	const
		{ avatarAndState: avatarAndStateStyle } = styles,
		{ avatar: avatarStyle } = avatarAndStateStyle
	
	return <div style={mergeStyles(avatarAndStateStyle,highlight && avatarAndStateStyle.highlight)}>
		
		
		<Avatar user={issue.assignee || User.UnknownUser}
		        style={makeStyle(avatarStyle,avatarStyle.root,highlight && avatarStyle.root.highlight)}
		        avatarStyle={makeStyle(avatarStyle,avatarStyle.image)}/>
	
	
	</div>
}

export default IssueItem