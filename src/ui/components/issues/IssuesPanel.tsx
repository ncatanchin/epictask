/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Map} from 'immutable'
import * as React from 'react'
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
	issueStateSelector, issueIdsSelector, issuesSelector, issueItemsSelector,
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


// Constants & Non-typed Components
const
	SplitPane = require('react-split-pane'),
	ReactList = require('react-list'),
	Resizable = require('react-component-resizable'),
	log = getLogger(__filename),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}


//region STYLES
const baseStyles = createStyles({
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
	issueGroupHeader: [FlexRowCenter, FlexAuto, FillWidth, {
		padding: '1rem 0.5rem',
		boxShadow: 'inset 0.1rem 0.1rem 0.5rem rgba(0,0,0,0.4)',
		spacer: [FlexScale],
		control: {
			padding: '0 1rem',
			backgroundColor: 'transparent'
		},
		labels: [FlexScale, {overflow: 'auto'}],
		stats: {
			number: {
				fontWeight: 700
			},
			fontWeight: 100,
			padding: '0 1rem',
			textTransform: 'uppercase'
		}
	}],
	
	issue: [
		makeTransition(['height', 'flex-grow', 'flex-shrink', 'flex-basis']),
		FlexRow,
		FlexAuto,
		FillWidth,
		FlexAlignStart,
		{
			padding: '1.5rem 1rem 0rem 1rem',
			cursor: 'pointer',
			boxShadow: 'inset 0 0.4rem 0.6rem -0.6rem black',
			
			// Issue selected
			selected: [],
			
			// Avatar component
			avatar: [{
				padding: '0'
			}]
		}
	],
	
	
	issueMarkers: makeStyle(FlexColumn, FlexAuto, {
		minWidth: '1rem',
		pointerEvents: 'none'
	}),
	
	
	issueDetails: makeStyle(FlexColumn, FlexScale, OverflowHidden, {
		padding: '0 0.5rem'
		//pointerEvents: 'none'
	}),
	
	issueRepoRow: makeStyle(FlexRow, makeFlexAlign('center', 'center'), {
		pointerEvents: 'none',
		padding: '0 0 0.5rem 0rem'
	}),
	
	issueNumber: [{
		fontSize: themeFontSize(1.1),
		fontWeight: 500
	}],
	
	issueRepo: makeStyle(Ellipsis, FlexRow, FlexScale, {
		fontSize: themeFontSize(1.1),
		
	}),
	
	issueTitleRow: makeStyle(makeTransition(['height']), FlexRowCenter, FillWidth, OverflowHidden, {
		padding: '0 0 1rem 0',
		pointerEvents: 'none'
	}),
	
	issueTitleTime: makeStyle(FlexAuto, {
		fontSize: themeFontSize(1),
		fontWeight: 100,
	}),
	
	
	// TODO: Fonts configured in theme, ones that aren't should be moved
	issueTitle: makeStyle(makeTransition(['font-size', 'font-weight']), Ellipsis, FlexScale, {
		display: 'block',
		padding: '0 1rem 0 0'
	}),
	
	
	issueTitleSelected: makeStyle({}),
	
	issueBottomRow: makeStyle(FlexRowCenter, {
		margin: '0rem 0 0.3rem 0',
		overflow: 'auto'
	}),
	
	issueMilestone: makeStyle(FlexAuto, Ellipsis, {
		fontSize: themeFontSize(1),
		padding: '0 1rem'
	}),
	
	
	/**
	 * Issue labels styling
	 */
	issueLabels: [makePaddingRem(), FlexScale, {
		overflowX: 'auto',
		//flexWrap: 'wrap',
		
		label: {
			marginTop: 0,
			marginRight: '0.7rem',
			marginBottom: '0.5rem',
			marginLeft: 0
		}
		
	}]
	
	
})
//endregion


/**
 * Issue group header component
 *
 */
function IssueGroupHeader({expanded,styles,onClick,issueGroup = {} as IIssueGroup}) {
	const {groupByItem, groupBy} = issueGroup
	return <div style={styles.issueGroupHeader} onClick={onClick}>
		<Icon iconSet='material-icons' style={styles.issueGroupHeader.control}>apps</Icon>
		{/*<Button style={styles.issueGroupHeader.control}>*/}
		{/*/!*<Icon iconSet='fa' iconName='chevron-right'/>*!/*/}
		{/*<Icon iconSet='material-icons'>apps</Icon>*/}
		{/*</Button>*/}
		
		
		{//GROUP BY MILESTONES
			(groupBy === 'milestone') ?
					<IssueLabelsAndMilestones
							style={styles.issueGroupHeader.labels}
							showIcon
							labels={[]}
							milestones={[!groupByItem ? {title:'No Milestone'} : groupByItem]}/> :
					
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
		{/*<div style={styles.issueGroupHeader.spacer} />*/}
		<div style={styles.issueGroupHeader.stats}>
			<span style={styles.issueGroupHeader.stats.number}>
				{issueGroup.items.length}
			</span>
			{/*&nbsp;Issues*/}
		</div>
		{/*<Icon iconSet='material-icons'>apps</Icon>*/}
	</div>
}

/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?: any
	styles?: any
	allItems?: IIssueListItem<any>[]
	hasAvailableRepos?: boolean
	issueSortAndFilter?: TIssueSortAndFilter
	labels?: Label[]
	milestones?: Milestone[]
	assignees?:User[]
	saving?: boolean
	selectedIssue?: Issue
	selectedIssueIds?:number[]
	editingInline?: boolean
	editInlineConfig?: TIssueEditInlineConfig
	
}

export interface IIssuesPanelState {
	firstSelectedIndex?: number
	issueList?: any
	items?: IIssueListItem<any>[]
	issueGroupsVisibility?: Map<string,boolean>
	
}


/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/
@HotKeyContext()
@connect(createStructuredSelector({
	enabledRepoIds: enabledRepoIdsSelector,
	selectedIssueIds: selectedIssueIdsSelector,
	issueSortAndFilter: issueSortAndFilterSelector,
	items: issueItemsSelector,
	editingInline: (state) => issueStateSelector(state).editingInline,
	editInlineConfig: (state) => issueStateSelector(state).editInlineConfig,
	saving: (state) => issueStateSelector(state).issueSaving
}, createDeepEqualSelector))



@ThemedStyles(baseStyles, 'issuesPanel')
@PureRender
export class IssuesPanel extends React.Component<IIssuesPanelProps,IIssuesPanelState> {
	
	static defaultProps = {
		allItems: []
	}
	
	constructor(props,context) {
		super(props,context)
		
		
	}
	
	
	uiActions: UIActionFactory = getUIActions()
	issueActions: IssueActionFactory = getIssueActions()
	
	
	private updateState = (props = this.props) => {
		const
			{allItems} = props,
			firstSelectedIndex = _.get(this.state,'firstSelectedIndex',-1),
			allGroups:IIssueListItem<IIssueGroup>[] = allItems.filter(item => isGroupListItem(item))
		
		let
			issueGroupsVisibility = _.get(this.state,'issueGroupsVisibility',Map<string,boolean>())
		
		
		// Create default group visibility map
		allGroups
			.filter(item => !issueGroupsVisibility.has(item.item.id))
			.forEach(itemGroup => {
				issueGroupsVisibility = issueGroupsVisibility.set(itemGroup.id,true)
			})
		
		// Based on group visibility, determine excluded issue ids
		const excludedIssueIds = allGroups
			.filter(itemGroup => !issueGroupsVisibility.get(itemGroup.id))
			.reduce((issueIds,nextItemGroup) => {
				
			const
					groupIssueIds = nextItemGroup.item.items.map(issueItem => issueItem.item.id)
				
				issueIds.push(...groupIssueIds)
				return issueIds
			},[])
		
		this.setState({
			issueGroupsVisibility,
			items: allItems.filter(item => isGroupListItem(item) || !excludedIssueIds.includes(item.item.id)),
			firstSelectedIndex
		})
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
			{
				issueSortAndFilter,
				selectedIssue,
				selectedIssueIds
			} = this.props,
			{items} = this.state,
			{groupBy} = issueSortAndFilter.issueSort
			
		
		log.debug('Enter pressed', selectedIssueIds, selectedIssue)
		
		if (selectedIssue) {
			let issueIndex = items.findIndex(item => item.id === `issue-${selectedIssue.id}`)
			
			
			assert(issueIndex > -1, 'Issue index not found')
			
			// Increment here to show the create below the current issue
			issueIndex++
			const issue = new Issue(_.cloneDeep(_.pick(
					selectedIssue,
					'repoId',
					'milestone',
					'labels'
			)))
			
			// this.issueActions.createIssueInline(selectedIssue)
			this.issueActions.editInline(
					issueIndex,
					issue
			)
			
		} else if (selectedIssueIds.length) {
			this.moveDown()
			//this.updateSelectedIssueIds([])
		}
	}
	
	/**
	 * On delete pressed
	 *
	 * @param event
	 */
	private onDelete = (event) => {
		const {selectedIssueIds} = this.props
		log.info(`OnDelete - going to remove`, selectedIssueIds)
		this.issueActions.setIssueState('closed', ...selectedIssueIds)
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
		[CommonKeys.SetAssignee]: () => {
			log.info('Patch assignee')
			Container.get(IssueActionFactory).patchIssuesAssignee()
		},
		[CommonKeys.SetMilestone]: () => {
			log.info('Patch milestone')
			Container.get(IssueActionFactory).patchIssuesMilestone()
		},
		[CommonKeys.AddLabels]: () => {
			log.info('Patch labels')
			Container.get(IssueActionFactory).patchIssuesLabel()
		},
		[CommonKeys.CreateComment]: () => {
			log.info('Create Comment')
			
			
			Container.get(IssueActionFactory).newComment()
		}
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
				{editingInline,selectedIssueIds} = this.props,
				{items,firstSelectedIndex} = this.state,
				issueItems = items.filter(it => it.type === IssueListItemType.Issue),
				issueCount = issueItems.length
				
			
			let
				index = ((firstSelectedIndex === -1) ? 0 : firstSelectedIndex) + increment
			
			// If more than one issue is selected then use
			// bounds to determine new selection index
			if (selectedIssueIds && selectedIssueIds.length > 1) {
				const {startIndex, endIndex} = this.getSelectionBounds()
				
				if (startIndex < firstSelectedIndex) {
					index = startIndex + increment
				} else {
					index = endIndex + increment
				}
				
			}
			
			// Make sure we don't keyboard select a group
			const isNewItemAGroup = (newIndex) => {
				return newIndex >= 0 && items[newIndex] && items[newIndex].type === IssueListItemType.Group
			}
			
			while (isNewItemAGroup(index)) {
				index += (increment < 0) ? -1 : 1
			}
			
			
			const adjustedIndex = Math.max(0, Math.min(items.length - 1, index))
			
			if (!items[index]) {
				log.info('No issue at index ' + index)
				return
			}
			
			
			// Calculate new selected ids
			let newSelectedIssueIds:number[] = (event && event.shiftKey) ?
				
				// Select block continuation
				this.calculateSelectedIssueIds(adjustedIndex, firstSelectedIndex) : // YOU ARE HERE - just map array of ids
				
				// Group or Null item
				!items[index] || isGroupListItem(items[index]) ? [] :
				
					// Issue item
					[items[index].item.id]
			
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
	
	private selectedIssueIdsHistory = []
	
	private doPushSelectedIssueIds(newSelectedIssueIds) {
		this.selectedIssueIdsHistory.unshift(newSelectedIssueIds)
		this.selectedIssueIdsHistory.length =
				Math.min(3, this.selectedIssueIdsHistory.length)
		
		this.issueActions.setSelectedIssueIds(newSelectedIssueIds)
		
	}
	
	updateSelectedIssueIds(newSelectedIssueIds: number[], force = false) {
		this.adjustScroll(newSelectedIssueIds)
		this.pushUpdatedSelectedIssueIds(newSelectedIssueIds)
	}
	
	
	pushUpdatedSelectedIssueIds = (newSelectedIssueIds) => {
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
			{items} = this.state,
			{selectedIssueIds} = this.props
		
		let
			startIndex = -1,
			endIndex = -1
		
		for (let issueId of selectedIssueIds) {
			const index = items.findIndex(item => item.id === `issue-${issueId}`)
			if (index === -1)
				continue
			
			if (startIndex === -1 || index < startIndex)
				startIndex = index
			
			if (endIndex === -1 || index > endIndex)
				endIndex = index
		}
		
		return {startIndex, endIndex}
	}
	
	
	calculateSelectedIssueIds(issueIndex, firstSelectedIndex):number[] {
		const
				{items} = this.state
		
		let startIndex = Math.max(0, Math.min(issueIndex, firstSelectedIndex))
		let endIndex = Math.min(items.length - 1, Math.max(issueIndex, firstSelectedIndex))
		
		return items
				.slice(startIndex, endIndex + 1)
				.map(item => (item.item as Issue).id)
	}
	
	/**
	 * On issue selection, updated selected issues
	 *
	 * @param event
	 * @param issue
	 */
	onIssueSelected = (event: MouseEvent, issue) => {
		let
			{selectedIssueIds} = this.props,
			{items} = this.state
		
		// Get the issue index for track of "last index"
		const
				issueIndex = items.findIndex(item => item.id === `issue-${issue.id}`),
				{firstSelectedIndex} = this.state
		
		// Set the 'first' selected index if not set
		// or no modifier
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
		return [null, undefined, true].includes(this.state.issueGroupsVisibility.get(groupId))
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
			issueGroupsVisibility: this.state
					.issueGroupsVisibility.set(groupId, !isVisible)
		})
	}
	
	/**
	 * on mount set default state
	 */
	componentWillMount = () => this.updateState()
	
	componentWillReceiveProps = (nextProps) => this.updateState(nextProps)
	
	/**
	 * Make issue render
	 */
	makeRenderIssueListItem() {
		/**
		 * Render issue item
		 *
		 * @param index
		 * @param key
		 * @returns {any}
		 */
		return (index, key) => {
			const
				{
					styles,
					issueSortAndFilter,
					saving,
					labels,
					milestones,
					editingInline,
					editInlineConfig
				} = this.props,
				{items,issueGroupsVisibility} = this.state,
				item = items[index]
			
			const
				{groupBy} = issueSortAndFilter.issueSort
			
			
			if (editingInline) {
				const
					{issueIndex:inlineIssueIndex} = editInlineConfig
				
				if (index === inlineIssueIndex) {
					// Inline issue editor
					return <IssueEditInline key={key}>
						inline create here
					</IssueEditInline>
				}
			}
			
			// Issue item
			return isGroupListItem(item) ?
				
				// GROUP
				<IssueGroupHeader
					onClick={() => this.toggleGroupVisible(item.item as IIssueGroup)}
					styles={styles}
					expanded={issueGroupsVisibility.get(item.item.id)}
					issueGroup={item.item as IIssueGroup}/> :
				
				// ISSUE
				<IssueItem
					key={key}
	        styles={styles}
	        item={item}
					groupBy={groupBy}
					onSelected={this.onIssueSelected}/>
				
		}
	}
	
	
	
	/**
	 * Render the component
	 */
	render() {
		const
			{
				theme,
				styles,
				issueSortAndFilter,
				editingInline,
				selectedIssueIds,
			} = this.props,
			{items} = this.state,
			{palette} = theme,
			{groupBy} = issueSortAndFilter.issueSort,
			
		
			validSelectedIssueIds = selectedIssueIds
					.filter(issueId =>
						!_.isNil(items.find(item =>
							!isGroupListItem(item) && item.item.id === issueId))),
			
			allowResize = validSelectedIssueIds && validSelectedIssueIds.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5),
			
			// Item count - groups or issues
			itemCount = items.length + (editingInline ? 1 : 0)
		
		
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
					<div style={styles.listContent}>
						{/* ISSUE FILTERS */}
						<IssueFilters />
						
						{/* ROOT LIST - groups or issues */}
						<div style={styles.listContainer}>
							<VisibleList items={items}
							             itemRenderer={this.makeRenderIssueListItem()}
							             initialItemsPerPage={50}
							             itemHeight={100}
							             bufferPages={3}
							/>
							                
							{/*<ReactList ref={c => this.setState({issueList:c})}*/}
							           {/*itemRenderer={groupBy === 'none' ? this.makeRenderIssue() : this.renderGroup}*/}
							           {/*itemsRenderer={(items, ref) => (*/}
											{/*<div ref={ref}>{items}</div>*/}
										{/*)}*/}
							           {/*length={itemCount}*/}
							           {/*type='simple'/>*/}
						
						
						</div>
					</div>
					
					{/* ISSUE DETAIL PANEL */}
					<IssueDetailPanel />
				
				</SplitPane>
			}
		</HotKeys>
	}
	
}
