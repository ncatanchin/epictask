/**
 * Created by jglanz on 5/30/16.
 */
// Imports
import { ObservableStore } from "typedux"
import * as React from "react"
import { Map, List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { PureRender } from "../../common"
import { IssueDetailPanel } from "./IssueDetailPanel"
import { Issue } from "epic-models"
import {
	selectedIssueIdsSelector,
	issueStateSelector,
	issuesSelector,
	issueGroupsSelector,
	issueItemsSelector,
	selectedIssueSelector,
	editInlineConfigIssueSelector,
	IIssueGroup,
	getIssueGroupId,
	IIssueListItem,
	IssueListItemType,
	TIssueEditInlineConfig,
	getIssueActions,
	getStoreState,
	SearchType
} from "epic-typedux"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandContainer
} from "epic-command-manager-ui"
import { CommonKeys, CommandType, CommandMenuItemType, getCommandManager, ContainerNames } from "epic-command-manager"
import { ThemedStyles, IThemedAttributes, FlexColumnCenter } from "epic-styles"
import { SearchPanel } from "epic-ui-components/search"
import { IssuesList } from "./IssuesList"
import { getValue, unwrapRef, MenuIds, isNumber, IssueKey } from "epic-global"


// Constants & Non-typed Components
const
	log = getLogger(__filename),
	SplitPane = require('react-split-pane'),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}

//DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)

//region STYLES
function baseStyles(topStyles,theme,palette) {
	
	const
		{primary,accent,text,background} = palette
	
	return {
		panel: [ Fill,FlexColumn, {} ],
		panelSplitPane: [ Fill, {
			' > .Pane2': makeStyle(OverflowHidden, {})
			
		} ],
		
		noItems: [Fill,FlexColumnCenter,{
			text: [{
				color: text.secondary,
				fontWeight: 100,
				fontSize: rem(1.6),
				lineSpacing: rem(1.9),
				letterSpacing: rem(0.3),
				textTransform: 'uppercase',
				textAlign: 'center',
				
				strong: [{
					color: text.primary,
					fontWeight: 500
				}]
				
			}]
			
			
		}],
		
		search: [ FlexAuto,makePaddingRem(0, 1), {
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
export interface IIssuesPanelProps extends IThemedAttributes {
	commandContainer?:CommandContainer
	
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


const
	CIDS = {
		NewIssue: 'NewIssue',
		LabelIssues: 'LabelIssues',
		MilestoneIssues: 'MilestoneIssues',
		FindIssues: 'FindIssues',
		CloseIssues: 'CloseIssues',
		NewComment: 'NewComment'
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
	
	static childContextTypes = {
		issuesPanel: React.PropTypes.object
	}
	
	
	
	/**
	 * Command builder
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder) =>
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
			
			// NEW COMMENT
			.command(
				CIDS.NewComment,
				CommandType.Container,
				'New Comment',
				(cmd, event) => getIssueActions().newComment(),
				"Ctrl+m")
			
			// MARK ISSUE FOCUSED
			.command(
				CommandType.Container,
				'Mark selected issues focused',
				(cmd,event) => getIssueActions().toggleSelectedAsFocused(),
				CommonKeys.Space)
			
			.command(
				CIDS.NewIssue,
				CommandType.App,
				'New Issue',
				(item, event) => getIssueActions().newIssue(),
				"CommandOrControl+n"
			)
			
			// CLOSE ISSUES
			.command(
				CIDS.CloseIssues,
				CommandType.Container,
				'Close selected issues',
				(cmd,event) => this.onDelete(event),
				CommonKeys.Delete)
			
			
			// CREATE INLINE
			.command(
				CommandType.Container,
				'Create a new issue inline',
				(cmd,event) => this.onEnter(event),
				CommonKeys.Enter,{
					hidden:true
				})
			
			// LABEL ISSUES
			.command(
				CIDS.LabelIssues,
				CommandType.Container,
				'Label selected issues',
				(cmd,event) => getIssueActions().patchIssuesLabel(),
				"CommandOrControl+t")
			
			// MILESTONE ISSUES
			.command(
				CIDS.MilestoneIssues,
				CommandType.Container,
				'Milestone selected issues',
				(cmd,event) => getIssueActions().patchIssuesMilestone(),
				"CommandOrControl+m")
				
			// FIND/FUZZY
			.command(
				CIDS.FindIssues,
				CommandType.Container,
				'Find Issues, Labels & Milestones...',
				this.openFindIssues,
				"CommandOrControl+f",{
					menuPath: ['Edit']
				})
			
			// INSERT INTO NAV MENU
			.menuItem(
				'find-issues-menu-item',
				CIDS.FindIssues,
				null,
				{
					menuPath: [MenuIds.Navigate]
				}
			)
			
			
			.menuItem(
				MenuIds.Issues,
				CommandMenuItemType.Menu,
				'Issues',
				{iconSet: 'octicon', iconName: 'issue-opened'},
				{
					mountsWithContainer: true,
					label: 'Issues',
					subItems: [
						{
							id: 'new-issue',
							type: CommandMenuItemType.Command,
							commandId: CIDS.NewIssue
						},
						{
							id: 'issues-sep-1',
							type:CommandMenuItemType.Separator
						},
						{
							id: 'milestone-issues',
							type: CommandMenuItemType.Command,
							commandId: CIDS.MilestoneIssues
						},{
							id: 'label-issues',
							type: CommandMenuItemType.Command,
							commandId: CIDS.LabelIssues
						},{
							id: 'new-comment',
							type: CommandMenuItemType.Command,
							commandId: CIDS.NewComment
						}
					
					]
				})
			
			.make()
		
	readonly commandComponentId = ContainerNames.IssuesPanel
	
	
	/**
	 * Open issue finder
	 *
	 * @param cmdOrMenuItem
	 * @param event
	 */
	private openFindIssues = (cmdOrMenuItem,event) => {
		
		const
			{searchPanel} = this,
			inputElement = searchPanel && searchPanel.inputElement
		
		log.debug('Fuzzy find',searchPanel,inputElement)
		
		if (inputElement)
			$(inputElement).focus()
		
	}
	
	/**
	 * Issue actions
	 *
	 * @type {IssueActionFactory}
	 */
	private issueActions = getIssueActions()
	
	
	
	private selectedIssueIdsUnsubscribe
	
	/**
	 * Private ref for selected issue ids
	 */
	
	private _selectedIssueIds:number[]
	
	private selectListeners:Function[] = []
	
	addSelectListener(listener) {
		if (!this.selectListeners.includes(listener))
			this.selectListeners.push(listener)
	}
	
	removeSelectListener(listener) {
		const
			index = this.selectListeners.indexOf(listener)
		
		if (index > -1)
			this.selectListeners.splice(index,1)
	}
	
	
	/**
	 * Get search panel
	 *
	 * @returns {SearchPanel}
	 */
	private get searchPanel():SearchPanel {
		return unwrapRef<SearchPanel>(getValue(() => this.state.searchPanelRef))
	}
	
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
	get selectedIssueIds():number[] {
		return this._selectedIssueIds || selectedIssueIdsSelector(getStoreState()) || []
	}
	
	set selectedIssueIds(ids:number[]) {
		this._selectedIssueIds = ids || []
		
		this.selectListeners.forEach(listener => listener())
	}
	
	
	/**
	 * Clear the cached selected issues
	 */
	clearSelectedIssueIds() {
		this._selectedIssueIds = null
	}
	
	/**
	 * Get item indexes from the embedded list
	 */
	private get itemIndexes():List<number> {
		const
			listRef = unwrapRef(getValue(() => this.state.listRef))
		
		return getValue(() => listRef.state.itemIndexes,List<number>()) as any
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
	 * Send an issues context down
	 *
	 * @returns {{issuesPanel: IssuesPanel}}
	 */
	getChildContext() {
		return {
			issuesPanel: this
		}
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
	
	
	
	pushSelectedIssueIds = _.debounce(() => {
		getIssueActions().setSelectedIssueIds(this.selectedIssueIds)
	},200)
	
	/**
	 * Update the internal selected issue ids & push to state
	 *
	 * @param newSelectedIssueIds
	 * @param force
	 */
	updateSelectedIssueIds(newSelectedIssueIds: number[], force = false) {
		this.adjustScroll(newSelectedIssueIds)
		this.selectedIssueIds = newSelectedIssueIds
		
		
		this.pushSelectedIssueIds()
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
		log.info(`Search escape`)
		// getValue(() => unwrapRef(this.state.searchPanelRef).blur())
		
		setTimeout(() => {
			getCommandManager().focusOnContainer(ContainerNames.IssuesPanel)
			// getValue(() => unwrapRef(this.state.listRef).focus())
			
		},100)
		return true
	}

	
	componentWillMount() {
		const
			store:ObservableStore<any> = Container.get(ObservableStore as any) as any
		this.selectedIssueIdsUnsubscribe = store.observe(
			[IssueKey,'selectedIssueIds'],
			(selectedIssueIds) => this.selectedIssueIds = selectedIssueIds)
	}
	
	componentWillUnmount() {
		if (this.selectedIssueIdsUnsubscribe) {
			this.selectedIssueIdsUnsubscribe()
			this.selectedIssueIdsUnsubscribe = null
		}
	}
	
	
	private makeNoContent(styles,itemsAvailable,allItemsFiltered) {
		if (itemsAvailable)
			return null
		
		if (allItemsFiltered) {
			return (<span>
					<span style={styles.noItems.text.strong}>filtered all the issues</span>
					&nbsp;in the your enabled repositories, you might want to check that
				</span>)
		} else {
			return (<span>
						<span style={styles.noItems.text.strong}>No issues exist</span>
						&nbsp;in your enabled repositories, why don't you create one
					</span>)
		}
	}
	
	/**
	 * Render the component
	 */
	render() {
		const
			{
				styles,
				palette,
				issues,
				items,
				commandContainer
			} = this.props,
			
			// FOCUSED BASED ON CONTAINER
			focused = commandContainer.isFocused(),
			
			selectedIssueIds = this.selectedIssueIds,
			
			
			validSelectedIssueIds = selectedIssueIds
					.filter(issueId =>
						!_.isNil(issues.find(issue => issue.id === issueId))),

			
			itemsAvailable = items && items.size > 0,
			allItemsFiltered = !itemsAvailable && issues.size,
			
			allowResize = itemsAvailable && validSelectedIssueIds && validSelectedIssueIds.length > 0,
			
			//allowResize = true,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5),
			
			noItemsContentNode = this.makeNoContent(styles,itemsAvailable,allItemsFiltered),
			noItemsNode = !itemsAvailable && <div style={styles.noItems}>
					<div style={styles.noItems.text}>
						{noItemsContentNode}
					</div>
						</div>
		
		
		return <CommandRoot
			component={this}
			style={styles.panel}
      id="issuesPanel">
			
			{/*<Style scopeSelector=".issuePanelSplitPane"*/}
			       {/*rules={styles.panelSplitPane}/>*/}
			
			
			{itemsAvailable && <SearchPanel
				ref={this.setSearchPanelRef}
				searchId='issues-search'
				types={[
					SearchType.Milestone,
					SearchType.Label,
					SearchType.Assignee,
					SearchType.Issue
				]}
				inlineResults={false}
				expanded={false}
				underlineStyle={makeStyle({borderBottomColor: Transparent})}
				underlineFocusStyle={{borderBottomColor: palette.primary.hue3}}
				panelStyle={styles.search}
				fieldStyle={styles.search.field}
				inputStyle={styles.search.input}
				onEscape={this.onSearchEscape}
				mode={'issues'}/>
			}
			
			
			{/* ISSUE SEARCH AND FILTERING */}
			{!itemsAvailable && !allItemsFiltered ? noItemsNode :
				<div style={[FlexScale,FillWidth,PositionRelative,OverflowHidden]}>
					<SplitPane split="vertical"
					           allowResize={allowResize}
					           minSize={listMinWidth}
					           maxSize={listMaxWidth}
					           className='issuePanelSplitPane'>
						
						{/* LIST CONTROLS FILTER/SORT */}
						<IssuesList
							
							ref={(listRef) => this.setState({listRef})}
							onIssueOpen={this.onIssueOpen}
							onIssueSelected={this.onIssueSelected}
							allItemsFilteredMessage={allItemsFiltered && noItemsNode}
						/>
						
						{/* ISSUE DETAIL PANEL */}
						<IssueDetailPanel />
					
					</SplitPane>
					
				</div>
				
			}
		</CommandRoot>
	}
	
}
