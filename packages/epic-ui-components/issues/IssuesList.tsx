/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Map,List} from 'immutable'
import * as React from 'react'
import * as Radium from 'radium'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {PureRender} from "../PureRender"
import { Issue, Milestone } from "epic-models"

import {
	issueStateSelector, issuesSelector,
	issueGroupsSelector, issueItemsSelector, groupVisibilitySelector, makeIssueGroupExpandedSelector,
} from "epic-typedux"
import {ThemedStyles} from "epic-styles"
import {IssueItem} from "./IssueItem"


import {FlexRowCenter} from "epic-styles"
import {IssueFilters} from "epic-ui-components"
import {
	IIssueGroup, getIssueGroupId, IIssueListItem,
	isGroupListItem, isGroupVisible, IssueListItemType, IIssueItemGroupProps, EditIssueInlineIndex, isEditInlineListItem
} from "epic-typedux"
import {Icon} from "epic-ui-components"
import {IssueLabelsAndMilestones} from "epic-ui-components"
import {IssueEditInline} from "epic-ui-components"
import { TIssueEditInlineConfig} from "epic-typedux"

import { VisibleList } from "epic-ui-components"
import { getUIActions, getIssueActions } from "epic-typedux"

import {createSelector} from 'reselect'
import { TransitionDurationLong } from "epic-styles"
import { IssuesPanel } from "epic-ui-components"
import { shallowEquals, shallowEqualsArrayOrList } from  "epic-common"
import { createDeepEqualSelector } from  "epic-common"
import { IThemedAttributes } from "epic-styles"



// Constants & Non-typed Components
const
	log = getLogger(__filename),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}


const baseStyles = (topStyles,theme,palette) => ({
	panel: [Fill, {}],
	panelSplitPane: [Fill, {
		' > .Pane2': makeStyle(OverflowHidden, {})
		
	}],
	
	listHeader: [FlexRow, FlexAuto, FillWidth, {
		padding: '0.5rem 1rem',
		
	}],
	
	
	list: [{
		width: 400
	}],
	listContent: [FlexColumn, FlexScale, Fill, OverflowHidden],
	listContainer: [FlexColumn, FlexScale, FillWidth, {
		overflow: 'auto'
	}],
	
	
	
	/**
	 * Issue group header
	 */
	issueGroupHeader: [FlexRowCenter, FlexAuto, FillWidth, makeTransition('background-color',TransitionDurationLong),{
		padding: '1rem 0.5rem',
		
		spacer: [FlexScale],
		
		middle: [FlexColumnCenter,FlexScale,{
			top: [FlexRow,FillWidth,makePaddingRem(0,0,1,0)],
			bottom: [FlexRow,FillWidth],
		}],
		
		text: [FlexScale,{
			fontWeight: 700,
			fontSize: rem(1.3)
		}],
		
		// Header Controls
		control: [makeTransition(['transform'],TransitionDurationLong),{
			width: rem(3),
			display: 'block',
			
			padding: '0 1rem',
			backgroundColor: 'transparent',
			transform: 'rotate(0deg)',
			expanded: [{
				transform: 'rotate(90deg)'
			}]
		}],
		labels: [FlexScale, OverflowAuto],
		stats: [FlexAuto,{
			number: {
				fontWeight: 700
			},
			fontWeight: 100,
			padding: '0 1rem',
			textTransform: 'uppercase'
		}]
	}],
	
	
	
	
	
	
})
//endregion


function setGroupVisible(id:string,visible:boolean) {
	getIssueActions().toggleGroupVisibility(id,visible)
}


interface IIssueGroupHeaderProps extends React.HTMLAttributes<any>,IIssueItemGroupProps {
	expanded?:boolean
	styles:any
}



/**
 * Issue group header component
 *
 */
@connect(() => {
	
	return createDeepEqualSelector(
		makeIssueGroupExpandedSelector(),
		(expanded) => ({expanded})
	)
})
@Radium
class IssueGroupHeader extends React.Component<IIssueGroupHeaderProps,any> {
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {}
	}
	
	componentWillReceiveProps(nextProps) {
		log.debug(`Group header getting props`,nextProps)
	}
	
	componentWillUnmount() {
		log.debug(`Header un-mounting`,this.props)
	}
	
	/**
	 * Checks whether expanded has changed OR group.id has changed
	 *
	 * @param nextProps
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssueGroupHeaderProps):boolean {
		log.debug(`Shallow equal update check`)
		return !shallowEquals(this.props,nextProps,'expanded','group.id')
	}
	
	render() {
		const
			{expanded,style,styles,onClick,group} = this.props,
			{ groupByItem, groupBy } = group,
			headerStyles = styles.issueGroupHeader,
			issueCount = group.issueIndexes.length
		
		log.debug(`Group by`,groupBy,`item`,groupByItem,group)
		
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
	
	issues?:List<Issue>
	items?: List<IIssueListItem<any>>
	groups?:List<IIssueGroup>
	groupVisibility?:Map<string,boolean>
	onIssueSelected:(event: MouseEvent, issue:Issue) => any
	onIssueOpen:(event: MouseEvent, issue:Issue) => any
	
	editingInline?: boolean
	editInlineConfig?: TIssueEditInlineConfig
	
	// WHEN ALL ITEMS HAVE BEEN FILTERED
	allItemsFilteredMessage?:any
	
}

export interface IIssuesListState {
	firstSelectedIndex?: number
	checkedItems?: List<IIssueListItem<any>>
	itemIndexes?:List<number>
	itemIds?:List<number>
}



/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@connect(createStructuredSelector({
	issues: issuesSelector,
	items: issueItemsSelector,
	groups: issueGroupsSelector,
	groupVisibility: groupVisibilitySelector,
	editInlineConfig: (state) => issueStateSelector(state).editInlineConfig
}),null,null,{withRef:true})
@ThemedStyles(baseStyles, 'issuesPanel')
export class IssuesList extends React.Component<IIssuesListProps,IIssuesListState> {
	
	
	/**
	 * Component constructor
	 *
	 * @param props
	 * @param context
	 */
	constructor(props,context) {
		super(props,context)
		
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
	private filterExcludedItems(
		items:List<IIssueListItem<any>>,
		itemIndexes:List<number>,
		issues:List<Issue>,
		groups:List<IIssueGroup>,
		groupVisibility:Map<string,boolean>,
		editInlineConfig:TIssueEditInlineConfig
	):List<number> {
		
		let
			excludeEditInline = false
		
		const
			excludedIssueIds = groups
				.filter(itemGroup => !isGroupVisible(groupVisibility,itemGroup.id))
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
				!excludedIssueIds.includes(_.get(items.get(itemIndex),'id'))
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
			{items,groups,issues,editInlineConfig} = props,
			itemIndexes = items.map((item,index) => index) as List<number>
		
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
			{groupVisibility,items,issues,groups,editInlineConfig} = props
			
		let
			checkedItems = _.get(this.state,'checkedItems',List<IIssueListItem<any>>()),
			itemIds = _.get(this.state,'itemIds',List<number>()),
			itemIndexes = _.get(this.state,'itemIndexes',List<number>()),
			groupsChanged = groupVisibility !== this.props.groupVisibility
		
		let
			itemsChanged = items !== this.props.items || items !== checkedItems
		
		// If the lists look similar then compare then compare the ids before running an update
		if (itemsChanged && itemIds && items) {
			
			itemsChanged = !shallowEqualsArrayOrList(itemIds,items.map(it => it.id))
			// if (!itemsChanged) {
			// 	srcItems = items
			// }
		}
		
		log.debug(`ITEMS CHANGED`,itemsChanged)
		
		if (itemsChanged) {
			
			checkedItems = items
			itemIds = checkedItems.map(it => it.id) as List<number>
			
			// Recreate index list
			itemIndexes = items.map((item,index) => index) as List<number>
			
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
		const lastIssueId = newSelectedIssueIds && newSelectedIssueIds[newSelectedIssueIds.length - 1]
		if (lastIssueId) {
			const elem = $(`#issue-item-${lastIssueId}`)[0] as any
			if (elem) {
				log.debug('scrolling into view', elem)
				elem.scrollIntoViewIfNeeded()
			}
		}
	}
	
	
	
	/**
	 * Toggle issue group collapsed/expanded
	 *
	 * @param group
	 */
	toggleGroupVisible(group: IIssueGroup) {
		
		log.debug(`Toggling group`,group)
		
		const
			groupId = getIssueGroupId(group),
			isVisible = isGroupVisible(this.props.groupVisibility,groupId)
		
		setGroupVisible(groupId,!isVisible)
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
	
	/**
	 * ONLY update when props.items or state.itemIndexes changes
	 *
	 * @param nextProps
	 * @param nextState
	 * @param nextContext
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:IIssuesListProps, nextState:IIssuesListState, nextContext:any):boolean {
		return !shallowEquals(nextProps,this.props,'editInlineConfig') || !shallowEquals(nextState,this.state,'itemIndexes')
	}
	
	/**
	 * Render issue item
	 *
	 * @param itemIndexes
	 * @param index
	 * @param style
	 * @param key
	 * @returns {string|number}
	 */
	renderItem = (itemIndexes:List<number>,index:number,style,key) => {
		const
			{
				styles,
				theme,
				items,
				onIssueSelected,
				onIssueOpen
			} = this.props,
			
			item = items.get(itemIndexes.get(index))
		
		
		return isGroupListItem(item) ?
			
			// GROUP
			<IssueGroupHeader
				onClick={() => this.toggleGroupVisible(item.item as IIssueGroup)}
				key={key}
				styles={styles}
				style={style}
				group={item.item as IIssueGroup}/> :
			
			isEditInlineListItem(item) ?
				<IssueEditInline key={key}
				                 style={style}/> :
			
			// ISSUE
			<IssueItem
				key={key}
				issueId={item.item.id}
				theme={theme}
				style={style}
				onOpen={onIssueOpen}
				onSelected={onIssueSelected}/>
		
	}
	
	
	/**
	 * Get the height of an item
	 *
	 * @param listItems
	 * @param listItem
	 * @param index
	 * @returns {number}
	 */
	getItemHeight = (listItems,listItem,index) => {
		const
			{items} = this.props,
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
			<IssueFilters />
			
			
			{/* ROOT LIST - groups or issues */}
			<div style={styles.listContainer}>
				{allItemsFilteredMessage ||
				<VisibleList items={itemIndexes}
				             itemCount={itemCount}
				             itemRenderer={this.renderItem}
				             itemKeyFn={(listItems,item,index) => {
				             	const
				             	  foundItem = checkedItems.get(itemIndexes.get(index))
				             	  
				             	
				             	return `${_.get(foundItem,'id',index)}`
				             }}
				             initialItemsPerPage={50}
				             itemHeight={this.getItemHeight}
				             transitionProps={transitionProps}
				
				/>
				}
			</div>
		</div>
		
	}
	
}
