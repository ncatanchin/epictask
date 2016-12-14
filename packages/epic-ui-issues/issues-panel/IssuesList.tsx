/**
 * Created by jglanz on 5/30/16.
 */
// Imports
import { Map, List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import {
	Issue,
	IIssueGroup,
	getIssueGroupId,
	IIssueListItem,
	isGroupListItem,
	isGroupVisible,
	IssueListItemType,
	EditIssueInlineIndex,
	isEditInlineListItem,
	IIssueEditInlineConfig
} from "epic-models"
import { VisibleList, IRowTypeConfig, PureRender } from "epic-ui-components"
import { getValue, shallowEqualsArrayOrList } from "epic-global"
import { ThemedStylesWithOptions, IThemedAttributes, ThemedStyles } from "epic-styles"

import { IssueItem } from "./IssueItem"
import { IssueEditInline } from "./IssueEditInline"
import IssuesPanelController, { getIssuesPanelSelector } from "./IssuesPanelController"
import { IssueGroupHeader } from "./IssueGroupHeader"


// Constants & Non-typed Components
const
	log = getLogger(__filename)



const baseStyles = (topStyles, theme, palette) => ({
	panel: [ Fill, {} ],
	panelSplitPane: [ Fill, {
		' > .Pane2': makeStyle(Styles.OverflowHidden, {})
		
	} ],
	
	listHeader: [ Styles.FlexRow, Styles.FlexAuto, Styles.FillWidth, {
		padding: '0.5rem 1rem',
		
	} ],
	
	
	list: [ {
		width: 400
	} ],
	
	listContent: [
		Styles.FlexColumn,
		Styles.FlexScale,
		Styles.Fill,
		Styles.OverflowHidden, {
			[Styles.CSSFocusState]: [theme.elementFocus]
		}
	],
	
	listContainer: [ Styles.FlexColumn, Styles.FlexScale, Styles.FillWidth, {
		overflow: 'auto'
	} ],
	
	
	
	
	
})
//endregion









/**
 * IIssuesPanelProps
 */
export interface IIssuesListProps extends IThemedAttributes {
	viewController:IssuesPanelController
	issues?:List<Issue>
	items?:List<IIssueListItem<any>>
	groups?:List<IIssueGroup>
	groupVisibility?:Map<string,boolean>
	onIssueSelected:(event:MouseEvent, issue:Issue) => any
	onIssueOpen:(event:MouseEvent, issue:Issue) => any

	editingInline?:boolean
	editInlineConfig?:IIssueEditInlineConfig
	
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
@ThemedStyles(baseStyles, 'issuesPanel')
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
	                            editInlineConfig:IIssueEditInlineConfig):List<number> {
		
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
	adjustScroll = _.debounce((newSelectedIssueIds) => {
		const lastIssueId = newSelectedIssueIds && newSelectedIssueIds.last()
		if (lastIssueId) {
			const elem = $(`#issue-item-${lastIssueId}`)[ 0 ] as any
			if (elem) {
				log.debug('scrolling into view', elem)
				elem.scrollIntoViewIfNeeded()
			}
		}
	},150)
	
	
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
					onToggle:this.toggleGroupVisible,
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
					convertRem(9.2) :
					convertRem(5)
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
		
		
		return <div
			className='focusable'
			style={styles.listContent}
			tabIndex={0}
			autoFocus>
			{/* ISSUE FILTERS */}
			{/*<IssueFilters viewController={this.props.viewController}/>*/}
			
			
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
