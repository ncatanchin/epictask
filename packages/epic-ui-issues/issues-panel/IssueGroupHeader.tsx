// Imports
import { Map, List } from "immutable"
import { connect } from "react-redux"
import * as Styles from "epic-styles/styles"
import { TransitionDurationLong, colorAlpha } from "epic-styles/styles"
import { createStructuredSelector, createSelector } from "reselect"
import { Icon,IRowState, IssueLabelsAndMilestones, FlexRowCenter } from "epic-ui-components/common"
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { getIssuesPanelSelector, IssuesPanelController } from "./IssuesPanelController"
import { getValue, shallowEquals } from "epic-global"
import { IIssueGroup, Milestone, IIssueListItem } from "epic-models"



// Constants
const
	log = getLogger(__filename),
	tiny = require('tinycolor2'),
	NO_LABELS_ITEM = { name: 'No Labels', color: 'ffffff' }

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [
		Styles.FlexAuto,
		Styles.FillWidth,
		Styles.makeTransition('background-color', TransitionDurationLong),
		Styles.makePaddingRem(1,0.5),{
			
			color: text.primary,
			boxShadow: 'inset 0.1rem 0.1rem 0.3rem ' + colorAlpha(primary.hue2,0.3),
			backgroundColor: tiny(primary.hue2).lighten(10).setAlpha(0.6),
			
			text: [ FlexScale, {
				fontWeight: 700,
				fontSize: rem(1.3)
			} ],
			
			// Header Controls
			control: [
				Styles.makeTransition([ 'transform' ], TransitionDurationLong),
				Styles.makePaddingRem(0,1),{
					cursor: 'pointer',
					width: rem(3),
					display: 'block',
					
					backgroundColor: 'transparent',
					transform: 'rotate(0deg)',
					expanded: [ {
						transform: 'rotate(90deg)'
					} ]
				}
			],
			labels: [ Styles.FlexScale, Styles.OverflowAuto ],
			stats: [ Styles.FlexAuto, {
				number: {
					fontWeight: 700
				},
				fontWeight: 100,
				padding: '0 1rem',
				textTransform: 'uppercase'
			} ]
		} ]
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
@ThemedStyles(baseStyles,'issueGroupHeader')
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
		return !shallowEquals(this.props, nextProps, 'groupVisibility', 'group','styles','theme','palette')
	}
	
	render() {
		const
			{ groupVisibility,group,style, styles, onToggle} = this.props
		
		if (!group)
			return React.DOM.noscript()
		
		const
			expanded = groupVisibility.get(group.id),
			{ groupByItem, groupBy } = group,
			headerStyles = styles,
			issueCount = group.issueIndexes.length
		
		log.debug(`Group by`, groupBy, `item`, groupByItem, group)
		
		return <FlexRowCenter style={[styles,style]}
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
						style={styles.labels}
						showIcon
						labels={[]}
						milestones={[!groupByItem ? Milestone.EmptyMilestone : groupByItem]}/> :
					
					// GROUP BY LABELS
					(groupBy === 'labels') ?
						<IssueLabelsAndMilestones
							style={styles.labels}
							showIcon
							labels={(!groupByItem || groupByItem.length === 0) ?
							[NO_LABELS_ITEM] :
							Array.isArray(groupByItem) ? groupByItem : [groupByItem]}/> :
						
						// GROUP BY ASSIGNEE
						<div
							style={styles.labels}>{!groupByItem ? 'Not assigned' : groupByItem.login}</div>
			}
			
			
			{/* STATS */}
			<div style={[styles.stats]}>
					<span style={styles.stats.number}>
						{issueCount}
					</span>
				&nbsp;Issue{issueCount !== 1 ? 's' : ''}
			</div>
		</FlexRowCenter>
	}
}

