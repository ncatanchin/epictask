// Imports
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { IRowState, IssueLabelsAndMilestones } from 'epic-ui-components/common'
import { IThemedAttributes, Themed } from 'epic-styles'
import { getIssuesPanelSelector, IssuesPanel, IssuesPanelController } from "epic-ui-components/pages/issues-panel"
import { getValue, shallowEquals } from "epic-global"
import { isGroupListItem, IIssueGroup, Milestone, IIssueListItem } from "epic-models"
import { Icon } from "epic-ui-components/common/icon/Icon"


// Constants
const
	log = getLogger(__filename),
	NO_LABELS_ITEM = { name: 'No Labels', color: 'ffffff' }

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


/**
 * IIssueGroupHeaderProps
 */
export interface IIssueGroupHeaderProps extends IThemedAttributes {
	viewController?:IssuesPanelController
	rowState?:IRowState<string,string,number>
	groupVisibility?:Map<string,boolean>
	group?:IIssueGroup
	onToggle:(event,group) => any
}


/**
 * IIssueGroupHeaderState
 */
export interface IIssueGroupHeaderState {
	
}

/**
 * IssueGroupHeader
 *
 * @class IssueGroupHeader
 * @constructor
 **/
/**
 * Issue group header component
 *
 */
@connect(() => {
	const
		realIndexSelector = (state, props:IIssueGroupHeaderProps) => props.rowState.item,
		
		groupSelector = createSelector(
			realIndexSelector,
			getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
			(realIndex:number, items:List<IIssueListItem<any>>) =>
				// 1st get the IIssueItem -> 2nd the .item = group
				getValue(() => items.get(realIndex).item)
		)
	
	return createStructuredSelector({
		groupVisibility: getIssuesPanelSelector(selectors => selectors.groupVisibilitySelector),
		group: groupSelector
	})
})
@Themed
export class IssueGroupHeader extends React.Component<IIssueGroupHeaderProps,void> {
	
	private get viewController() {
		return this.props.viewController
	}
	
	setGroupVisible(id:string, visible:boolean) {
		this.viewController.toggleGroupVisibility(id, visible)
	}

	/**
	 * Checks whether expanded has changed OR group.id has changed
	 *
	 * @param nextProps
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssueGroupHeaderProps):boolean {
		log.debug(`Shallow equal update check`)
		return !shallowEquals(this.props, nextProps, 'groupVisibility', 'group')
	}
	
	render() {
		const
			{ groupVisibility,group,style, styles, onToggle} = this.props
		
		if (!group)
			return React.DOM.noscript()
		
		const
			expanded = groupVisibility.get(group.id),
			{ groupByItem, groupBy } = group,
			headerStyles = styles.issueGroupHeader,
			issueCount = group.issueIndexes.length
		
		log.debug(`Group by`, groupBy, `item`, groupByItem, group)
		
		return <div style={[headerStyles,expanded && headerStyles.expanded,style]}
		            id={`group-${group.id}`}
		            onClick={onToggle && ((event) => onToggle(event,group))}>
			<div style={[headerStyles.control,expanded && headerStyles.control.expanded]}>
				<Icon
					iconSet='fa'
					iconName={'chevron-right'}/>
			</div>
			
			{/* GROUPING */}
			{
				//GROUP BY MILESTONES
				(groupBy === 'milestone') ?
					<IssueLabelsAndMilestones
						style={headerStyles.labels}
						showIcon
						labels={[]}
						milestones={[!groupByItem ? Milestone.EmptyMilestone : groupByItem]}/> :
					
					// GROUP BY LABELS
					(groupBy === 'labels') ?
						<IssueLabelsAndMilestones
							style={styles.issueGroupHeader.labels}
							showIcon
							labels={(!groupByItem || groupByItem.length === 0) ?
							[NO_LABELS_ITEM] :
							Array.isArray(groupByItem) ? groupByItem : [groupByItem]}/> :
						
						// GROUP BY ASSIGNEE
						<div
							style={styles.issueGroupHeader.labels}>{!groupByItem ? 'Not assigned' : groupByItem.login}</div>
			}
			
			
			{/* STATS */}
			<div style={[headerStyles.stats]}>
					<span style={headerStyles.stats.number}>
						{issueCount}
					</span>
				&nbsp;Issue{issueCount !== 1 ? 's' : ''}
			</div>
		</div>
	}
}

