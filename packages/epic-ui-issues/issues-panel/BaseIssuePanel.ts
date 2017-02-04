

import { IThemedAttributes } from "epic-styles"
import { CommandContainer } from "epic-command-manager-ui"
import {List,Map} from 'immutable'
import { Issue, IIssueGroup, IIssueListItem, IssueListItemType } from "epic-models"
import { unwrapRef } from "epic-util"
import { getValue, isNumber } from "typeguard"
import { IssuesPanelController } from "epic-ui-issues/issues-panel/IssuesPanelController"
import { IssuesPanelState } from "epic-ui-issues/issues-panel/IssuesPanelState"
import { View } from "epic-typedux/state/window"

const
	log = getLogger(__filename)


/**
 * IIssuesPanelProps
 */
export interface IBaseIssuesPanelProps extends IThemedAttributes, IViewRootProps<IssuesPanelController,IssuesPanelState> {
	commandContainer?:CommandContainer
	
	issues?:List<Issue>
	groups?: List<IIssueGroup>
	items?: List<IIssueListItem<any>>
	
}

export interface IBaseIssuesPanelState {
	firstSelectedIndex?: number
	listItems?: any
	srcItems?: List<IIssueListItem<any>>
	groupsVisibility?:Map<string,boolean>
	listRef?:any
	searchFieldRef?:any
	
}



export abstract class BaseIssuePanel<P extends IBaseIssuesPanelProps,S extends IBaseIssuesPanelState> extends React.Component<P,S> {
	
	
	/**
	 * View controller
	 */
	get viewController() {
		return this.props.viewController
	}
	
	/**
	 * Get the state
	 */
	get viewState():IssuesPanelState {
		return this.props.viewState
	}
	
	/**
	 * View State
	 */
	get view():View {
		return this.props.view
	}
	
	
	get selectedIssue() {
		return this.viewController.getSelectedIssue()
	}
	
	get selectedIssues() {
		return this.viewController.getSelectedIssues()
	}
	
	
	/**
	 * Helper to get the current selected issue ids
	 *
	 * @returns {Array<number>|Array}
	 */
	get selectedIssueIds():List<number> {
		return this.getSelectedIssueIds()
	}
	
	/**
	 * Set the current selected issue ids
	 *
	 * @param ids
	 */
	set selectedIssueIds(ids:List<number>) {
		//this._selectedIssueIds = ids || List<number>()
		this.viewController.setSelectedIssueIds(ids || List<number>())
		
	}
	
	
	
	getSelectedIssueIds() {
		return this.viewController.getState().selectedIssueIds
	}
	
	
	/**
	 * Clear the cached selected issues
	 */
	clearSelectedIssueIds() {
		
	}
	
	/**
	 * Get item indexes from the embedded list
	 */
	get itemIndexes():List<number> {
		const
			listRef = unwrapRef(getValue(() => this.state.listRef))
		
		return getValue(() => listRef.state.itemIndexes,List<number>()) as any
	}
	
	
	/**
	 * On enter, clear selection if more than
	 * 1 issue selected, nothing if 0
	 * or add new if 1
	 */
	onEnter = (event) => {
		const
			{items} = this.props
		
		
		const
			{selectedIssueIds} = this,
			selectedIssue = this.viewController.getSelectedIssue()
		
		log.debug('Enter pressed', selectedIssueIds, selectedIssue)
		
		
		
		if (selectedIssue) {
			// One issue selected
			this.viewController.editInline(selectedIssue)
		} else if (selectedIssueIds.size) {
			// Otherwise move down and clear selection
			this.moveDown()
		}
	}
	
	
	/**
	 * Move selection up
	 */
	moveUp(event = null) {
		this.moveSelection(-1,event)
	}
	
	/**
	 * Move selection down
	 */
	moveDown(event = null) {
		this.moveSelection(1,event)
	}
	
	/**
	 * Create a move selector for key handlers
	 *
	 * @param increment
	 * @param event
	 */
	moveSelection(increment: number, event: React.KeyboardEvent<any> = null) {
		
		
		log.debug(`Move selector/update`,event)
		
		const
			{groups} = this.props,
			selectedIssueIds = this.selectedIssueIds,
			{itemIndexes} = this,
			itemCount = getValue(() => itemIndexes.size,0),
			issueCount = itemCount - getValue(() => groups.size,0)
		
		let
			{firstSelectedIndex = -1} = this.state,
			index = ((firstSelectedIndex === -1) ? 0 : firstSelectedIndex) + increment
		
		
		
		// If more than one issue is selected then use
		// bounds to determine new selection index
		if (selectedIssueIds && selectedIssueIds.size > 1) {
			const
				{startIndex, endIndex} = this.getSelectionBounds()
			
			if (startIndex < firstSelectedIndex) {
				index = startIndex + increment
			} else {
				index = endIndex + increment
			}
			
		}
		
		// Make sure we don't keyboard select a group
		const isNewItemAGroup = (newIndex) => {
			const
				item = newIndex > -1 && this.getItemAtIndex(newIndex)
			
			return item && item.type === IssueListItemType.Group
		}
		
		while (isNewItemAGroup(index)) {
			index += (increment < 0) ? -1 : 1
		}
		
		
		const
			adjustedIndex = Math.max(0, Math.min(itemCount - 1, index)),
			item = this.getItemAtIndex(adjustedIndex)
		
		if (!item) {
			log.info('No issue at index' + index,item,adjustedIndex,itemCount,this.itemIndexes,unwrapRef(this.state.listRef),this.state.listRef)
			return
		}
		
		
		// Calculate new selected ids
		let newSelectedIssueIds:List<number> = (event && event.shiftKey) ?
			
			// Select block continuation
			this.calculateSelectedIssueIds(adjustedIndex, firstSelectedIndex) : // YOU ARE HERE - just map array of ids
			
			// Issue item
			List<number>(!item ? [] : [item.id as number])
		
		
		
		
		if (!event || !event.shiftKey)
			this.setState({firstSelectedIndex: index} as S)
		
		
		log.debug('Keyed move', {
			increment,
			index,
			firstSelectedIndex,
			selectedIssueIds,
			newSelectedIssueIds,
		})
		
		
		this.updateSelectedIssueIds(newSelectedIssueIds)
		
		
		
	}
	
	adjustScroll(newSelectedIssueIds) {
		//guard(() => (this.state.listRef as IssuesList).adjustScroll(newSelectedIssueIds))
		const lastIssueId = newSelectedIssueIds && newSelectedIssueIds.last()
		if (lastIssueId) {
			const elem = $(`#issue-item-${lastIssueId}`)[ 0 ] as any
			if (elem) {
				log.debug('scrolling into view', elem)
				elem.scrollIntoViewIfNeeded()
			}
		}
	}
	
	
	/**
	 * Update the internal selected issue ids & push to state
	 *
	 * @param newSelectedIssueIds
	 * @param force
	 */
	updateSelectedIssueIds(newSelectedIssueIds: List<number>, force = false) {
		this.adjustScroll(newSelectedIssueIds)
		this.selectedIssueIds = newSelectedIssueIds
		
	}
	
	
	
	/**
	 * Retrieves the start and end index
	 * of the current issue list selection
	 *
	 * endIndex is INCLUSIVE
	 *
	 * @returns {{startIndex: number, endIndex: number}}
	 */
	getSelectionBounds() {
		const
			selectedIssueIds = this.selectedIssueIds
		
		let
			startIndex = -1,
			endIndex = -1
		
		selectedIssueIds.forEach(issueId => {
			const
				index = this.getIssueIndex(issueId)
			
			if (index === -1)
				return
			
			if (startIndex === -1 || index < startIndex)
				startIndex = index
			
			if (endIndex === -1 || index > endIndex)
				endIndex = index
		})
		
		return {startIndex, endIndex}
	}
	
	/**
	 * Based on start and end index - calculate selected issue ids
	 *
	 * @param issueIndex
	 * @param firstSelectedIndex
	 * @returns {number[]}
	 */
	calculateSelectedIssueIds(issueIndex, firstSelectedIndex):List<number> {
		const
			{itemIndexes} = this,
			{items} = this.props
		
		let
			startIndex = Math.max(0, Math.min(issueIndex, firstSelectedIndex)),
			endIndex = Math.min(items.size - 1, Math.max(issueIndex, firstSelectedIndex))
		
		let
			selectedIds = itemIndexes
				.slice(startIndex, endIndex + 1)
				.map(itemIndex => items.get(itemIndex))
				.filter(item => !!item)
				.map(item => item.id) as List<number>
		
		return ((issueIndex < firstSelectedIndex) ?
			selectedIds.reverse() :
			selectedIds) as List<number>
	}
	
	
	/**
	 * Get item at a real index, not sorted index
	 *
	 * @param realIndex
	 * @returns {T}
	 */
	getItem(realIndex:number):IIssueListItem<any> {
		return getValue(() => this.props.items.get(realIndex))
	}
	
	/**
	 * Get issue or froup @ index
	 *
	 * @param itemIndex
	 * @returns {null}
	 */
	getItemAtIndex = (itemIndex) => {
		return getValue(() => this.getItem(
			this.itemIndexes.get(itemIndex)
		))
	}
	
	
	/**
	 * Get the index for a given issue or id
	 *
	 * @param issueOrIssueId
	 * @returns {any}
	 */
	getIssueIndex = (issueOrIssueId:Issue|number) => {
		const
			issueId = isNumber(issueOrIssueId) ? issueOrIssueId : issueOrIssueId.id,
			{items} = this.props,
			{itemIndexes} = this
		
		if (!items || !itemIndexes)
			return null
		
		return itemIndexes.findIndex(itemIndex => {
			const
				item = items.get(itemIndex)
			
			return item.id as number === issueId
		})
	}
	
	
}