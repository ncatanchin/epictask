/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Map,List} from 'immutable'
import * as React from 'react'
import * as Radium from 'radium'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {Style} from 'radium'

import {PureRender} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import { Issue, User } from 'shared/models'

import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {
	issueSortAndFilterSelector,
	selectedIssueIdsSelector,
	issueStateSelector, issueIdsSelector, issuesSelector, selectedIssueIdSelector, orderedIssueIndexesSelector,
	issueGroupsSelector, issueItemsSelector, selectedIssueSelector, editInlineConfigIssueSelector,
} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import * as KeyMaps from 'shared/KeyMaps'
import {CommonKeys} from 'shared/KeyMaps'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import IssueItem from 'ui/components/issues/IssueItem'

import {Milestone} from 'shared/models/Milestone'
import {Label} from 'shared/models/Label'
import {FlexRowCenter} from 'shared/themes/styles/CommonStyles'
import {IssueFilters} from 'ui/components/issues/IssueFilters'
import {
	IIssueGroup, getIssueGroupId, IIssueListItem, IssueListItemType,
	isGroupListItem
} from 'shared/actions/issue/IIssueListItems'
import {Icon} from 'ui/components/common/Icon'
import {IssueLabelsAndMilestones} from 'ui/components/issues/IssueLabelsAndMilestones'
import {IssueEditInline} from 'ui/components/issues/IssueEditInline'
import { TIssueEditInlineConfig, TIssueSortAndFilter } from 'shared/actions/issue/IssueState'
import { enabledRepoIdsSelector } from 'shared/actions/repo/RepoSelectors'
import { HotKeys } from "ui/components/common/Other"
import { VisibleList } from "ui/components/common/VisibleList"
import { getUIActions, getIssueActions } from "shared/actions/ActionFactoryProvider"
import { getStoreState } from "shared/store"
import { IssuesList } from "ui/components/issues/IssuesList"
import { isNumber, shallowEquals } from "shared/util/ObjectUtil"


// Constants & Non-typed Components
const
	log = getLogger(__filename),
	SplitPane = require('react-split-pane'),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}


//region STYLES
const baseStyles = createStyles({
	panel: [Fill, {}],
	panelSplitPane: [Fill, {
		' > .Pane2': makeStyle(OverflowHidden, {})
		
	}]
	
})
//endregion

/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?: any
	styles?: any
	issues?:List<Issue>
	groups?: List<IIssueGroup>
	items?: List<IIssueListItem<any>>
	//selectedIssueIds?:number[]
	hasAvailableRepos?: boolean
	saving?: boolean
	editInlineConfig?: TIssueEditInlineConfig
	
}

export interface IIssuesPanelState {
	firstSelectedIndex?: number
	listItems?: any
	srcItems?: List<IIssueListItem<any>>
	groupsVisibility?:Map<string,boolean>
	listRef?:any
	
}


/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/
@HotKeyContext()
@connect(createStructuredSelector({
	issues: issuesSelector,
	items: issueItemsSelector,
	groups: issueGroupsSelector,
	editInlineConfig: editInlineConfigIssueSelector,
	saving: (state) => issueStateSelector(state).issueSaving
}))
@ThemedStyles(baseStyles, 'issuesPanel')
@PureRender
export class IssuesPanel extends React.Component<IIssuesPanelProps,IIssuesPanelState> {
	
	
	
	uiActions: UIActionFactory = getUIActions()
	issueActions: IssueActionFactory = getIssueActions()
	
	/**
	 * Helper to get the current selected issue ids
	 *
	 * @returns {Array<number>|Array}
	 */
	private get selectedIssueIds():number[] {
		return selectedIssueIdsSelector(getStoreState()) || []
	}
	
	
	/**
	 * Get item indexes from the embedded list
	 */
	private get itemIndexes():List<number> {
		let
			listRef = _.get(this.state,'listRef',null)
		
		
		while(listRef && listRef.getWrappedInstance) {
			listRef = listRef.getWrappedInstance()
		}
		
		return _.get(listRef,'state.itemIndexes',List<number>()) as any
	}
	
	/**
	 * Move selection up
	 */
	private moveUp = this.makeMoveSelector(-1)
	
	/**
	 * Move selection down
	 */
	private moveDown = this.makeMoveSelector(1)
	
	/**
	 * On enter, clear selection if more than
	 * 1 issue selected, nothing if 0
	 * or add new if 1
	 */
	private onEnter = () => {
		const
			{items} = this.props
			
			
		const
			{selectedIssueIds} = this,
			selectedIssue = selectedIssueSelector(getStoreState())
		
		log.debug('Enter pressed', selectedIssueIds, selectedIssue)
		
		
		// One issue selected
		if (selectedIssue) {
			this.issueActions.editInline()
		}
		// Otherwise move down and clear selection
		else if (selectedIssueIds.length) {
			this.moveDown()
		}
	}
	
	/**
	 * On delete pressed
	 *
	 * @param event
	 */
	private onDelete = (event) => {
		const
			selectedIssueIds = this.selectedIssueIds
		
		log.info(`OnDelete - going to remove`, selectedIssueIds)
		this.issueActions.setIssueStatus('closed', ...selectedIssueIds)
	}
	
	/**
	 * Key handlers for Issue Panel
	 */
	keyHandlers = {
		[CommonKeys.MoveUp]: this.moveUp,
		[CommonKeys.MoveDown]: this.moveDown,
		[CommonKeys.MoveUpSelect]: this.moveUp,
		[CommonKeys.MoveDownSelect]: this.moveDown,
		[CommonKeys.Enter]: this.onEnter,
		[CommonKeys.Delete]: this.onDelete,
		
		[CommonKeys.SetAssignee]: (event) => {
			log.info('Patch assignee')
			getIssueActions().patchIssuesAssignee()
			event.preventDefault()
		},
		[CommonKeys.SetMilestone]: (event) => {
			log.info('Patch milestone')
			getIssueActions().patchIssuesMilestone()
			event.preventDefault()
		},
		[CommonKeys.AddLabels]: (event) => {
			log.info('Patch labels')
			getIssueActions().patchIssuesLabel()
			event.preventDefault()
		},
		[CommonKeys.CreateComment]: (event) => {
			log.info('Create Comment')
			
			getIssueActions().newComment()
			event.preventDefault()
		},
		[CommonKeys.Edit]: () => {
			log.info('Edit issue keys pressed - making dialog visible')
			getIssueActions().editIssue()
		},
	}
	
	// Helper for sorting
	getItemAtIndex = (itemIndex) => {
		const
			{items} = this.props,
			{itemIndexes} = this
		
		if (!items || !itemIndexes)
			return null
		
		return items.get(itemIndexes.get(itemIndex))
	}
	
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
	
	/**
	 * Create a move selector for key handlers
	 *
	 * @param increment
	 * @returns {(event:any)=>undefined}
	 */
	makeMoveSelector(increment: number) {
		
		return (event: React.KeyboardEvent<any> = null) => {
			log.info(`Move selector`,event)
			
			const
				{groups} = this.props,
				selectedIssueIds = this.selectedIssueIds,
				{itemIndexes} = this,
				itemCount = itemIndexes.size,
				issueCount = itemCount - groups.size
			
			let
				{firstSelectedIndex = -1} = this.state,
				index = ((firstSelectedIndex === -1) ? 0 : firstSelectedIndex) + increment
			
			
			
			// If more than one issue is selected then use
			// bounds to determine new selection index
			if (selectedIssueIds && selectedIssueIds.length > 1) {
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
				item = this.getItemAtIndex(index)
			
			if (!item) {
				log.info('No issue at index ' + index)
				return
			}
			
			
			// Calculate new selected ids
			let newSelectedIssueIds:number[] = (event && event.shiftKey) ?
				
				// Select block continuation
				this.calculateSelectedIssueIds(adjustedIndex, firstSelectedIndex) : // YOU ARE HERE - just map array of ids
				
				// Issue item
				!item ? [] : [item.id as number]
				
					
					
			
			if (!event || !event.shiftKey)
				this.setState({firstSelectedIndex: index})
			
			
			log.debug('Keyed move', {
				increment,
				index,
				firstSelectedIndex,
				selectedIssueIds,
				newSelectedIssueIds,
			})
			
			
			this.updateSelectedIssueIds(newSelectedIssueIds)
			
		}
		
	}
	
	adjustScroll(newSelectedIssueIds) {
		const lastIssueId = newSelectedIssueIds && newSelectedIssueIds[newSelectedIssueIds.length - 1]
		if (lastIssueId) {
			const elem = $(`#issue-item-${lastIssueId}`)[0] as any
			if (elem) {
				log.info('scrolling into view', elem)
				//elem.scrollIntoView({block: "start", behavior: "smooth"})
				elem.scrollIntoViewIfNeeded()
			}
		}
	}
	
	
	
	/**
	 * Push the most current selected issue ids
	 */
	private doPushSelectedIssueIds(newSelectedIssueIds) {
		getIssueActions().setSelectedIssueIds(newSelectedIssueIds)
		
		// this.selectedIssueIdsHistory.unshift(newSelectedIssueIds)
		// this.selectedIssueIdsHistory.length =
		// 		Math.min(3, this.selectedIssueIdsHistory.length)
		//
		// this.issueActions.setSelectedIssueIds(newSelectedIssueIds)
		
	}
	
	/**
	 * Update the internal selected issue ids & push to state
	 *
	 * @param newSelectedIssueIds
	 * @param force
	 */
	updateSelectedIssueIds(newSelectedIssueIds: number[], force = false) {
		this.adjustScroll(newSelectedIssueIds)
		
		this.doPushSelectedIssueIds(newSelectedIssueIds)
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
		
		for (let issueId of selectedIssueIds) {
			const
				index = this.getIssueIndex(issueId)
			
			if (index === -1)
				continue
			
			if (startIndex === -1 || index < startIndex)
				startIndex = index
			
			if (endIndex === -1 || index > endIndex)
				endIndex = index
		}
		
		return {startIndex, endIndex}
	}
	
	/**
	 * Based on start and end index - calculate selected issue ids
	 *
	 * @param issueIndex
	 * @param firstSelectedIndex
	 * @returns {number[]}
	 */
	calculateSelectedIssueIds(issueIndex, firstSelectedIndex):number[] {
		const
			{itemIndexes} = this,
			{items} = this.props
		
		let
			startIndex = Math.max(0, Math.min(issueIndex, firstSelectedIndex)),
			endIndex = Math.min(items.size - 1, Math.max(issueIndex, firstSelectedIndex))
		
		return itemIndexes
			.slice(startIndex, endIndex + 1)
			.map(itemIndex => items.get(itemIndex))
			.filter(item => !!item)
			.map(item => item.id)
			.toArray() as number[]
	}
	
	/**
	 * On issue selection, updated selected issues
	 *
	 * @param event
	 * @param issue
	 * @param index
	 */
	onIssueSelected = (event: MouseEvent, issue) => {
		let
			selectedIssueIds = this.selectedIssueIds,
			{items} = this.props,
			{itemIndexes} = this
		
		// Get the issue index for track of "last index"
		const
				issueIndex = this.getIssueIndex(issue),
				{firstSelectedIndex} = this.state
		
		// Set the 'first' selected index if not set
		// or no modifier
		log.info(`Issue selected`,issue,'at index',issueIndex)
		if (
				issueIndex > -1 && (
						selectedIssueIds.length === 0 ||
						(!event.shiftKey && !event.metaKey)
				)
		) {
			this.setState({firstSelectedIndex: issueIndex})
		}
		
		// Recalculate the selection block with shift
		if (event.shiftKey) {
			selectedIssueIds = this.calculateSelectedIssueIds(issueIndex, firstSelectedIndex)
		}
		
		// Toggle the issue selection if meta key used
		else if (event.metaKey) {
			
			const wasSelected = selectedIssueIds.includes(issue.id)
			selectedIssueIds = (wasSelected) ?
					selectedIssueIds.filter(id => id !== issue.id) :
					selectedIssueIds.concat([issue.id]) as any
			
			
		} else {
			selectedIssueIds = [issue.id]
		}
		
		
		this.updateSelectedIssueIds(selectedIssueIds, true)
		log.debug('Received issue select')
	}
	
	
	/**
	 * Is an issue group visible
	 *
	 * @param groupId
	 */
	isIssueGroupVisible(groupId: string) {
		return [null, undefined, true].includes(this.state.groupsVisibility.get(groupId))
	}
	
	
	/**
	 * Toggle issue group collapsed/expanded
	 *
	 * @param group
	 */
	toggleGroupVisible(group: IIssueGroup) {
		
		const
			groupId = getIssueGroupId(group),
			isVisible = this.isIssueGroupVisible(groupId)
		
		this.setState({
			groupsVisibility: this.state
					.groupsVisibility.set(groupId, !isVisible)
		})
	}

	/**
	 * Render the component
	 */
	render() {
		const
			{
				theme,
				styles,
				issues,
				editInlineConfig
			} = this.props,
			selectedIssueIds = this.selectedIssueIds,
			{items} = this.props,
			{palette} = theme,
			
			
			validSelectedIssueIds = selectedIssueIds
					.filter(issueId =>
						!_.isNil(issues.find(issue => issue.id === issueId))),

			allowResize = validSelectedIssueIds && validSelectedIssueIds.length > 0,
			//allowResize = true,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5),
			
			// Item count - groups or issues
			itemCount = items.size
		
		
		return <HotKeys style={styles.panel}
		                keyMap={KeyMaps.App}
		                handlers={this.keyHandlers}
										id="issuesPanel">
			
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>
			
			
			{items &&
				<SplitPane split="vertical"
				           allowResize={allowResize}
				           minSize={listMinWidth}
				           maxSize={listMaxWidth}
				           className='issuePanelSplitPane'>
					
					{/* LIST CONTROLS FILTER/SORT */}
					<IssuesList
						ref={(listRef) => this.setState({listRef})}
						onIssueSelected={this.onIssueSelected} />
					
					{/* ISSUE DETAIL PANEL */}
					<IssueDetailPanel />
				
				</SplitPane>
			}
		</HotKeys>
	}
	
}
