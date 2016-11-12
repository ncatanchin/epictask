/**
 * Created by jglanz on 5/30/16.
 */
// Imports
import { Map, List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { Issue, Milestone } from "epic-models"
import {
	IIssueGroup,
	getIssueGroupId,
	IIssueListItem,
	isGroupListItem,
	isGroupVisible,
	IssueListItemType,
	EditIssueInlineIndex,
	isEditInlineListItem,
	TIssueEditInlineConfig
} from "epic-typedux"
import { ThemedStyles, FlexRowCenter, TransitionDurationLong, IThemedAttributes } from "epic-styles"
import { IssueItem } from "./IssueItem"
import { IssueFilters } from "./IssueFilters"
import { Icon, IssueLabelsAndMilestones, VisibleList } from "epic-ui-components"
import { IssueEditInline } from "./IssueEditInline"
import { uuid, shallowEquals, shallowEqualsArrayOrList, createDeepEqualSelector } from "epic-global"
import { getValue } from "epic-global/ObjectUtil"
import { IRowState, IRowTypeConfig } from "epic-ui-components/common/VisibleList"
import { IssuesPanel } from "epic-ui-components/pages/issues-panel/IssuesPanel"
import IssuePanelController from "epic-ui-components/pages/issues-panel/IssuePanelController"
import { getIssuesPanelSelector } from "epic-ui-components/pages/issues-panel/IssuePanelController"
import { ThemedStylesWithOptions } from "epic-styles/ThemeDecorations"
import { PureRender } from "epic-ui-components/common/PureRender"


// Constants & Non-typed Components
const
	log = getLogger(__filename),
	NO_LABELS_ITEM = { name: 'No Labels', color: 'ffffff' }


const baseStyles = (topStyles, theme, palette) => ({
	panel: [ Fill, {} ],
	panelSplitPane: [ Fill, {
		' > .Pane2': makeStyle(OverflowHidden, {})
		
	} ],
	
	listHeader: [ FlexRow, FlexAuto, FillWidth, {
		padding: '0.5rem 1rem',
		
	} ],
	
	
	list: [ {
		width: 400
	} ],
	listContent: [ FlexColumn, FlexScale, Fill, OverflowHidden ],
	listContainer: [ FlexColumn, FlexScale, FillWidth, {
		overflow: 'auto'
	} ],
	
	
	/**
	 * Issue group header
	 */
	issueGroupHeader: [ FlexRowCenter, FlexAuto, FillWidth, makeTransition('background-color', TransitionDurationLong), {
		padding: '1rem 0.5rem',
		
		spacer: [ FlexScale ],
		
		middle: [ FlexColumnCenter, FlexScale, {
			top: [ FlexRow, FillWidth, makePaddingRem(0, 0, 1, 0) ],
			bottom: [ FlexRow, FillWidth ],
		} ],
		
		text: [ FlexScale, {
			fontWeight: 700,
			fontSize: rem(1.3)
		} ],
		
		// Header Controls
		control: [ makeTransition([ 'transform' ], TransitionDurationLong), {
			width: rem(3),
			display: 'block',
			
			padding: '0 1rem',
			backgroundColor: 'transparent',
			transform: 'rotate(0deg)',
			expanded: [ {
				transform: 'rotate(90deg)'
			} ]
		} ],
		labels: [ FlexScale, OverflowAuto ],
		stats: [ FlexAuto, {
			number: {
				fontWeight: 700
			},
			fontWeight: 100,
			padding: '0 1rem',
			textTransform: 'uppercase'
		} ]
	} ],
	
	
})
//endregion





export interface IIssueGroupHeaderProps extends IThemedAttributes {
	styles:any
	viewController?:IssuePanelController
	rowState?:IRowState<string,string,number>
}

export interface IIssueGroupHeaderState {
	rowState?:IRowState<string,string,number>
	group?:IIssueGroup
	realIndex?:number
	item?:IIssueListItem<any>
	
	expanded?:boolean
}


/**
 * Issue group header component
 *
 */

@Radium
class IssueGroupHeader extends React.Component<IIssueGroupHeaderProps,IIssueGroupHeaderState> {
	
	static contextTypes = {
		issuesPanel:React.PropTypes.object
	}
	
	constructor(props, context) {
		super(props, context)
		
		this.state = {}
	}
	
	private get viewController() {
		return this.props.viewController
	}
	
	setGroupVisible(id:string, visible:boolean) {
		this.viewController.toggleGroupVisibility(id, visible)
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
	 * Update state
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{rowState} = props,
			realIndex:number = rowState.item,
			panel = this.issuesPanel,
			item = panel.getItem(realIndex),
			group = item && isGroupListItem(item) && item.item
		
		this.setState({
			rowState,
			realIndex,
			group,
			item
		})
	}
	
	/**
	 * On mount update state
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props update state
	 */
	componentWillReceiveProps = this.updateState
	
	
	/**
	 * Checks whether expanded has changed OR group.id has changed
	 *
	 * @param nextProps
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssueGroupHeaderProps):boolean {
		log.debug(`Shallow equal update check`)
		return !shallowEquals(this.props, nextProps, 'expanded', 'group.id')
	}
	
	render() {
		const
			{ style, styles, onClick} = this.props,
			{group,expanded} = this.state
		if (!group)
			return React.DOM.noscript()
		
		const
			{ groupByItem, groupBy } = group,
			headerStyles = styles.issueGroupHeader,
			issueCount = group.issueIndexes.length
		
		log.debug(`Group by`, groupBy, `item`, groupByItem, group)
		
		return <div style={[headerStyles,expanded && headerStyles.expanded,style]}
		            id={`group-${group.id}`}
		            onClick={onClick}>
			<div style={[headerStyles.control,expanded && headerStyles.control.expanded]}>
				<Icon style={[]}
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

/**
 * IIssuesPanelProps
 */
export interface IIssuesListProps extends IThemedAttributes {
	viewController:IssuePanelController
	issues?:List<Issue>
	items?:List<IIssueListItem<any>>
	groups?:List<IIssueGroup>
	groupVisibility?:Map<string,boolean>
	onIssueSelected:(event:MouseEvent, issue:Issue) => any
	onIssueOpen:(event:MouseEvent, issue:Issue) => any
	
	editingInline?:boolean
	editInlineConfig?:TIssueEditInlineConfig
	
	// WHEN ALL ITEMS HAVE BEEN FILTERED
	allItemsFilteredMessage?:any
	
}

export interface IIssuesListState {
	firstSelectedIndex?:number
	checkedItems?:List<IIssueListItem<any>>
	itemIndexes?:List<number>
	itemIds?:List<number>
}

class IssueItemVisibleList extends VisibleList<string,string,number> {
}



/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@connect(() => createStructuredSelector({
	issues: getIssuesPanelSelector(selectors => selectors.issuesSelector),
	items: getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
	groups: getIssuesPanelSelector(selectors => selectors.issueGroupsSelector),
	groupVisibility: getIssuesPanelSelector(selectors => selectors.groupVisibilitySelector),
	editInlineConfig: getIssuesPanelSelector(selectors => selectors.editInlineConfigIssueSelector)
}), null, null, { withRef: true })
@ThemedStylesWithOptions({enableRef:true},baseStyles, 'issuesPanel')
@PureRender
export class IssuesList extends React.Component<IIssuesListProps,IIssuesListState> {
	
	
	/**
	 * Component constructor
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
		
		this.state = {
			itemIndexes: List<number>()
		}
	}
	
	
	/**
	 * Filter any collapsed groups, etc
	 *
	 * @param items
	 * @param itemIndexes
	 * @param issues
	 * @param groups
	 * @param groupVisibility
	 * @param editInlineConfig
	 */
	private filterExcludedItems(items:List<IIssueListItem<any>>,
	                            itemIndexes:List<number>,
	                            issues:List<Issue>,
	                            groups:List<IIssueGroup>,
	                            groupVisibility:Map<string,boolean>,
	                            editInlineConfig:TIssueEditInlineConfig):List<number> {
		
		let
			excludeEditInline = false
		
		const
			excludedIssueIds = groups
				.filter(itemGroup => !isGroupVisible(groupVisibility, itemGroup.id))
				.reduce((issueIds, nextItemGroup) => {
					
					const
						groupIssueIds = _.nilFilter(
							nextItemGroup.issueIndexes.map(issueIndex => {
								const
									issue = issues.get(issueIndex)
								
								// CHECK IF THIS ISSUE MATCHES THE EDIT FROM - IF SO THEN EXCLUDE IT
								if (editInlineConfig && issue && issue.id === editInlineConfig.fromIssueId)
									excludeEditInline = true
								
								return issue && issueIndex > -1 && issue.id
							})
						)
					
					issueIds.push(...groupIssueIds)
					return issueIds
				}, [])
		
		return itemIndexes.filter(itemIndex => {
			return (itemIndex === EditIssueInlineIndex) ?
				!excludeEditInline :
				!excludedIssueIds.includes(_.get(items.get(itemIndex), 'id'))
		}) as List<number>
		
	}
	
	/**
	 * Filter any collapsed groups
	 *
	 * @param props
	 */
	private updateGroupFilteredIndexes(props = this.props) {
		//if (props.groupVisibility !== this.props.groupVisibility) {
		log.debug(`Group visibility changed - updating exclusions`)
		const
			{ items, groups, issues, editInlineConfig } = props,
			itemIndexes = items.map((item, index) => index) as List<number>
		
		this.setState({
			itemIndexes: this.filterExcludedItems(
				items,
				itemIndexes,
				issues,
				groups,
				props.groupVisibility,
				editInlineConfig)
		})
	}
	
	
	/**
	 * Updates the scope when items change
	 *
	 * @param props
	 * @returns {boolean} - true if changed, false otherwise
	 */
	private updateState = (props = this.props) => {
		const
			{ groupVisibility, items, issues, groups, editInlineConfig } = props
		
		let
			checkedItems = getValue(() => this.state.checkedItems, List<IIssueListItem<any>>()),
			itemIds = _.get(this.state, 'itemIds', List<number>()),
			itemIndexes = _.get(this.state, 'itemIndexes', List<number>()),
			groupsChanged = groupVisibility !== this.props.groupVisibility
		
		let
			itemsChanged = items !== this.props.items || items !== checkedItems
		
		// If the lists look similar then compare then compare the ids before running an update
		if (itemsChanged && itemIds && items) {
			
			itemsChanged = !shallowEqualsArrayOrList(itemIds, items.map(it => it.id))
			// if (!itemsChanged) {
			// 	srcItems = items
			// }
		}
		
		log.debug(`ITEMS CHANGED`, itemsChanged)
		
		if (itemsChanged) {
			
			checkedItems = items
			itemIds = checkedItems.map(it => it.id) as List<number>
			
			// Recreate index list
			itemIndexes = items.map((item, index) => index) as List<number>
			
			// Update groups if specified
			if (groups.size) {
				itemIndexes = this.filterExcludedItems(
					items,
					itemIndexes,
					issues,
					groups,
					groupVisibility,
					editInlineConfig)
			}
			
			this.setState({
				itemIndexes,
				itemIds,
				checkedItems
			})
			
			return true
		}
		
		if (groupsChanged)
			this.updateGroupFilteredIndexes(props)
		
		return false
	}
	
	
	/**
	 * Adjusted the scroll for selected items
	 *
	 * @param newSelectedIssueIds
	 */
	private adjustScroll(newSelectedIssueIds) {
		const lastIssueId = newSelectedIssueIds && newSelectedIssueIds[ newSelectedIssueIds.length - 1 ]
		if (lastIssueId) {
			const elem = $(`#issue-item-${lastIssueId}`)[ 0 ] as any
			if (elem) {
				log.debug('scrolling into view', elem)
				elem.scrollIntoViewIfNeeded()
			}
		}
	}
	
	
	private get viewController() {
		return this.props.viewController
	}
	
	setGroupVisible(id:string, visible:boolean) {
		this.viewController.toggleGroupVisibility(id, visible)
	}
	
	/**
	 * Toggle issue group collapsed/expanded
	 *
	 * @param event
	 * @param group
	 */
	toggleGroupVisible = (event, group:IIssueGroup) => {
		
		log.debug(`Toggling group`, group)
		
		const
			groupId = getIssueGroupId(group),
			isVisible = isGroupVisible(this.props.groupVisibility, groupId)
		
		this.setGroupVisible(groupId, !isVisible)
	}
	
	/**
	 * on mount set default state
	 */
	componentWillMount() {
		this.updateState()
	}
	
	/**
	 * Update internal state with new props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps(nextProps:IIssuesListProps) {
		this.updateState(nextProps)
	}
	
	// /**
	//  * ONLY update when props.items or state.itemIndexes changes
	//  *
	//  * @param nextProps
	//  * @param nextState
	//  * @param nextContext
	//  * @returns {boolean}
	//  */
	// shouldComponentUpdate(nextProps:IIssuesListProps, nextState:IIssuesListState, nextContext:any):boolean {
	// 	return !shallowEquals(nextProps, this.props, 'styles','style','editInlineConfig', 'items') || !shallowEquals(nextState, this.state, 'itemIndexes')
	// }
	//
	
	buildItem = (rowType:string):IRowTypeConfig<string,string,number> => {
		const
			{
				styles,
				onIssueSelected,
				onIssueOpen
			} = this.props
		
		return rowType === "group-header" ?
			{
				clazz: IssueGroupHeader,
				props: {
					onClick:this.toggleGroupVisible,
					styles,
					viewController: this.viewController
				}
			}
			 :
			
			rowType === "edit-inline" ?
			{
				clazz: IssueEditInline,
				props: {
					viewController: this.viewController
					
				}
			} : {
				clazz: IssueItem,
				props: {
					onOpen: onIssueOpen,
					onSelected: onIssueSelected,
					viewController: this.viewController
				}
			}
				
	}
	
	getRowType = (itemIndexes:List<number>,index,key) => {
			const
				{items} = this.props,

				item = items.get(itemIndexes.get(index))


			return isGroupListItem(item) ?
				'group-header' :

				isEditInlineListItem(item) ?
					'edit-inline' :
					'issue'

	}
	
	/**
	 * Get the height of an item
	 *
	 * @param listItems
	 * @param listItem
	 * @param index
	 * @returns {number}
	 */
	getItemHeight = (listItems, listItem, index) => {
		const
			{ items } = this.props,
			item = items.get(listItems.get(index))
		
		
		return !item ? 0 :
			item.type === IssueListItemType.Group ?
				convertRem(4) :
				item.type === IssueListItemType.EditIssueInline ?
					convertRem(21.2) :
					convertRem(10)
	}
	
	/**
	 * Render the component
	 */
	render() {
		const
			{
				styles,
				editingInline,
				allItemsFilteredMessage
			} = this.props,
			{
				itemIndexes,
				checkedItems
			} = this.state,
			
			// Item count - groups or issues
			itemCount = itemIndexes.size + (editingInline ? 1 : 0),
			
			transitionProps = {}
		
		
		return <div style={styles.listContent}>
			{/* ISSUE FILTERS */}
			<IssueFilters viewController={this.props.viewController}/>
			
			
			{/* ROOT LIST - groups or issues */}
			<div style={styles.listContainer}>
				{allItemsFilteredMessage ||
				<IssueItemVisibleList
					items={itemIndexes}
					itemCount={itemCount}
					itemBuilder={this.buildItem}
					itemKeyFn={(listItems,item,index) => {
				             	const
				             	  foundItem = checkedItems.get(itemIndexes.get(index))
				             	  
				             	
				             	return `${_.get(foundItem,'id',index)}`
				             }}
					initialItemsPerPage={50}
					rowTypeProvider={this.getRowType}
					itemHeight={this.getItemHeight}
				
				/>
				}
			</div>
		</div>
		
	}
	
}
