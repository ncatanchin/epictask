/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Map,List} from 'immutable'
import {connect} from 'react-redux'
import {createStructuredSelector} from 'reselect'
import {Style} from 'radium'

import {PureRender} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import { Issue } from 'shared/models'

import {
	selectedIssueIdsSelector,
	issueStateSelector, issuesSelector,
	issueGroupsSelector, issueItemsSelector, selectedIssueSelector, editInlineConfigIssueSelector,
} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {CommonKeys} from 'shared/KeyMaps'
import {ThemedStyles} from 'shared/themes/ThemeManager'

import {
	IIssueGroup, getIssueGroupId, IIssueListItem, IssueListItemType
} from 'shared/actions/issue/IIssueListItems'
import { TIssueEditInlineConfig} from 'shared/actions/issue/IssueState'
import { getIssueActions, getUIActions } from  "shared/actions/ActionFactoryProvider"
import { getStoreState } from "shared/store"
import { IssuesList } from "ui/components/issues/IssuesList"
import { isNumber } from "shared/util/ObjectUtil"
import {
	CommandComponent, ICommandComponent, getCommandProps, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { ICommand, Command, CommandType } from "shared/commands/Command"
import { ContainerNames } from "shared/config/CommandContainerConfig"
import { SearchPanel } from "ui/components/search"
import { SearchType } from "shared/actions/search"



// Constants & Non-typed Components
const
	log = getLogger(__filename),
	SplitPane = require('react-split-pane'),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}


//region STYLES
const baseStyles = (topStyles,theme,palette) => {
	
	const
		{primary,accent,text,background} = palette
	
	return {
		panel: [ Fill, {} ],
		panelSplitPane: [ Fill, {
			' > .Pane2': makeStyle(OverflowHidden, {})
			
		} ],
		
		search: [ makePaddingRem(0, 1), {
			backgroundColor: Transparent,
			borderBottom: `0.1rem solid ${primary.hue3}`,
			
			field: [ {
				backgroundColor: Transparent
			} ],
			input: [ {
				backgroundColor: Transparent
			} ],
			hint: [ {} ]
			
		} ]
		
	}
}
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
	searchPanelRef?:any
	
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
	editInlineConfig: editInlineConfigIssueSelector,
	saving: (state) => issueStateSelector(state).issueSaving
}))
@CommandComponent()
@ThemedStyles(baseStyles, 'issuesPanel')
@PureRender
export class IssuesPanel extends React.Component<IIssuesPanelProps,IIssuesPanelState> implements ICommandComponent {
	
	
	/**
	 * Command builder
	 *
	 * @param builder
	 */
	commands = (builder:CommandContainerBuilder) =>
		builder
			//MOVEMENT
			.command(
				CommandType.Container,
				'Move down',
				(cmd,event) => this.moveDown(event),
				CommonKeys.MoveDown,{hidden:true})
			.command(
				CommandType.Container,
				'Move down select',
				(cmd,event) => this.moveDown(event),
				CommonKeys.MoveDownSelect,{hidden:true})
			.command(
				CommandType.Container,
				'Move up',
				(cmd,event) => this.moveUp(event),
				CommonKeys.MoveUp,{hidden:true})
			.command(
				CommandType.Container,
				'Move up select',
				(cmd,event) => this.moveUp(event),
				CommonKeys.MoveUpSelect,{hidden:true})
			
			
			// CLOSE ISSUES
			.command(
				CommandType.Container,
				'Close selected issues',
				(cmd,event) => this.onDelete(event),
				CommonKeys.Delete)
			
			// CREATE INLINE
			.command(
				CommandType.Container,
				'Create a new issue inline',
				(cmd,event) => this.onEnter(event),
				CommonKeys.Enter)
			
			// LABEL ISSUES
			.command(
				CommandType.Container,
				'Label select issues',
				(cmd,event) => {
					log.debug('Patch labels')
					getIssueActions().patchIssuesLabel()
				},
				"CommandOrControl+t",{
					menuPath: ['Issue']
				})
			
			// MILESTONE ISSUES
			.command(
				CommandType.Container,
				'Milestone select issues',
				(cmd,event) => {
					log.debug('Patch milestones')
					getIssueActions().patchIssuesMilestone()
				},
				"CommandOrControl+m",{
					menuPath: ['Issue']
				})
			
			
			.make()
		
	readonly commandComponentId = ContainerNames.IssuesPanel
	
	/**
	 * Issue actions
	 *
	 * @type {IssueActionFactory}
	 */
	private issueActions: IssueActionFactory = getIssueActions()
	
	
	/**
	 * Set search panel ref
	 *
	 * @param searchPanelRef
	 */
	private setSearchPanelRef = (searchPanelRef) => this.setState({searchPanelRef})
	
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
	private onEnter = (event) => {
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
	 * Get issue or froup @ index
	 *
	 * @param itemIndex
	 * @returns {null}
	 */
	getItemAtIndex = (itemIndex) => {
		const
			{items} = this.props,
			{itemIndexes} = this
		
		if (!items || !itemIndexes)
			return null
		
		return items.get(itemIndexes.get(itemIndex))
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
	 * Open an issue (usually double click)
	 *
	 * @param event
	 * @param issue
	 */
	onIssueOpen = (event: MouseEvent, issue) => {
		log.debug(`Received issue open`,issue)
		if (!issue) {
			return
		}
		
		this.updateSelectedIssueIds([issue.id])
		getIssueActions().editIssue(issue)
		
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
	 * On escape sequence close the search
	 */
	onSearchEscape = () => {
		
		// log.info(`Header on escape`)
		//
		// if (this.isExpanded)
		// 	return
		//
		// if (this.textField)
		// 	this.textField.blur()
		//
		//getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
		
		// const {searchPanel} = this
		//
		// if (searchPanel) {
		// 	const textField:any = searchPanel.textField
		// 	if (textField) {
		// 		textField.blur()
		// 	} else {
		// 		const doc = document as any
		// 		doc.activeElement.blur()
		// 	}
		// }
		
		//ActionFactoryProviders[UIKey].focusIssuesPanel()
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
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)
		
		
		return <CommandRoot
			component={this}
			style={styles.panel}
      id="issuesPanel">
			
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>
			
			{/* ISSUE SEARCH AND FILTERING */}
			<SearchPanel
				ref={this.setSearchPanelRef}
				searchId='issues-search'
				types={[SearchType.Milestone,
					SearchType.Label,
					SearchType.Assignee,
					SearchType.Issue,
					SearchType.Repo,
					SearchType.AvailableRepo
				]}
				inlineResults={false}
				expanded={false}
				panelStyle={styles.search}
				fieldStyle={styles.search.field}
				inputStyle={styles.search.input}
				onEscape={this.onSearchEscape}
				mode={'issues'}/>
			
			{/* ISSUES LIST & DETAILS*/}
			{items &&
				<SplitPane split="vertical"
				           allowResize={allowResize}
				           minSize={listMinWidth}
				           maxSize={listMaxWidth}
				           className='issuePanelSplitPane'>
					
					{/* LIST CONTROLS FILTER/SORT */}
					<IssuesList
						
						ref={(listRef) => this.setState({listRef})}
						onIssueOpen={this.onIssueOpen}
						onIssueSelected={this.onIssueSelected} />
					
					{/* ISSUE DETAIL PANEL */}
					<IssueDetailPanel />
				
				</SplitPane>
			}
		</CommandRoot>
	}
	
}
