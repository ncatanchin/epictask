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
	issueGroupsSelector, issueItemsSelector,
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
			height: rem(9.1),
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
		
		wrapper: [FlexScale,{
			overflow: 'hidden',
			marginRight: rem(1)
		}],
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

interface IIssueGroupHeaderProps extends React.HTMLAttributes<any> {
	expanded:boolean
	styles:any
	issueGroup:IIssueGroup
}

/**
 * Issue group header component
 *
 */
@Radium
@PureRender
class IssueGroupHeader extends React.Component<IIssueGroupHeaderProps,void> {
	render() {
		const
			{expanded,style,styles,onClick,issueGroup} = this.props,
			{ groupByItem, groupBy } = issueGroup
		
		return <div style={[styles.issueGroupHeader,style]} onClick={onClick}>
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
					{issueGroup.issueIndexes.length}
				</span>
				{/*&nbsp;Issues*/}
			</div>
			{/*<Icon iconSet='material-icons'>apps</Icon>*/}
		</div>
	}
}

/**
 * IIssuesPanelProps
 */
export interface IIssuesListProps {
	theme?: any
	styles?: any
	issues?:List<Issue>
	items?: List<IIssueListItem<any>>
	groups?:List<IIssueGroup>
	onIssueSelected:(event: MouseEvent, issue:Issue) => any
	hasAvailableRepos?: boolean
	saving?: boolean
	editingInline?: boolean
	editInlineConfig?: TIssueEditInlineConfig
	
}

export interface IIssuesListState {
	firstSelectedIndex?: number
	listItems?: any
	srcItems?: List<IIssueListItem<any>>
	groupsVisibility?:Map<string,boolean>
	itemIndexes?:List<number>
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
	editingInline: (state) => issueStateSelector(state).editingInline,
	editInlineConfig: (state) => issueStateSelector(state).editInlineConfig,
	saving: (state) => issueStateSelector(state).issueSaving
}),null,null,{withRef:true})
@ThemedStyles(baseStyles, 'issuesPanel')
@PureRender
export class IssuesList extends React.Component<IIssuesListProps,IIssuesListState> {
	
	
	
	uiActions: UIActionFactory = getUIActions()
	issueActions: IssueActionFactory = getIssueActions()
	
	constructor(props,context) {
		super(props,context)
		this.state = {
			itemIndexes: List<number>()
		}
	}
	
	private filterExcludedItems(items:List<IIssueListItem<any>>,itemIndexes:List<number>,issues:List<Issue>,groups:List<IIssueGroup>,groupsVisibility:Map<string,boolean>) {
		const excludedIssueIds = groups
			.filter(itemGroup => !groupsVisibility.get(itemGroup.id))
			.reduce((issueIds, nextItemGroup) => {
				
				const
					groupIssueIds = nextItemGroup.issueIndexes.map(issueIndex => issues.get(issueIndex).id)
				
				issueIds.push(...groupIssueIds)
				return issueIds
			}, [])
		
		return itemIndexes.filter(itemIndex => excludedIssueIds.includes(items.get(itemIndex).id))
		
	}
	
	private updateState = (props = this.props) => {
		const
			{items,issues,groups} = props
		
		let
			srcItems = _.get(this.state,'srcItems',List<IIssueListItem<any>>()),
			groupsVisibility = _.get(this.state,'groupsVisibility',Map<string,boolean>()),
			itemIndexes = _.get(this.state,'itemIndexes',List<number>()),
			listItems = _.get(this.state,'listItems',{})
		
		
		if (srcItems !== items) {
			srcItems = items
			
			// Recreate index list
			itemIndexes = srcItems.map((item,index) => index) as List<number>
			
			// Remove any cached list items
			listItems = {}
			// if (listItems) {
			// 	Object.keys(listItems).forEach(listItemId => {
			// 		if (items.findIndex(it => it.id === listItemId) === -1)
			// 			delete listItems[ listItemId ]
			//
			// 	})
			// }
			
			// Update groups if specified
			if (groups.size) {
				groups
					.filter(item => !groupsVisibility.has(item.id))
					.forEach(itemGroup => {
						groupsVisibility = groupsVisibility.set(itemGroup.id, true)
					})
				
				
				itemIndexes = this.filterExcludedItems(items,itemIndexes,issues,groups,groupsVisibility) as List<number>
			}
			
			this.setState({
				itemIndexes,
				groupsVisibility,
				srcItems,
				listItems
			})
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
	 * on mount set default state
	 */
	componentWillMount() {
		this.updateState()
	}
	
	componentWillReceiveProps(nextProps) {
		log.info(`Got new props`)
		this.updateState(nextProps)
	}
	
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
		return (itemIndexes:List<number>,index:number,style,key) => {
			const
				{
					styles,
					editingInline,
					editInlineConfig,
					items,
					onIssueSelected
				} = this.props,
				{groupsVisibility, listItems} = this.state,
				item = items.get(itemIndexes.get(index))
			
			
			if (editingInline) {
				const
					{issueIndex:inlineIssueIndex} = editInlineConfig
				
				if (index === inlineIssueIndex) {
					// Inline issue editor
					return <IssueEditInline key={'edit-inline'}>
						inline create here
					</IssueEditInline>
				}
			}
			
			return isGroupListItem(item) ?
				
				// GROUP
				<IssueGroupHeader
					key={key}
					onClick={() => this.toggleGroupVisible(item.item as IIssueGroup)}
					styles={styles}
					style={style}
					expanded={groupsVisibility.get(item.item.id)}
					issueGroup={item.item as IIssueGroup}/> :
				
				// ISSUE
				<IssueItem
					key={key}
					styles={styles}
					style={style}
					item={item}
					onSelected={onIssueSelected}/>
			
			
			// let
			// 	listItem = listItems[item.id]
			//
			// if (!listItem) {
			// 	listItem = listItems[item.id] = isGroupListItem(item) ?
			//
			// 		// GROUP
			// 		<IssueGroupHeader
			// 			key={key}
			// 			onClick={() => this.toggleGroupVisible(item.item as IIssueGroup)}
			// 			styles={styles}
			// 			style={style}
			// 			expanded={groupsVisibility.get(item.item.id)}
			// 			issueGroup={item.item as IIssueGroup}/> :
			//
			// 		// ISSUE
			// 		<IssueItem
			// 			key={key}
			// 			styles={styles}
			// 			style={style}
			// 			item={item}
			// 			onSelected={this.onIssueSelected}/>
			//
			//
			// }
			//
			// // Issue item
			// return listItem
			
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
				editingInline
			} = this.props,
			{itemIndexes} = this.state,
			
			// Item count - groups or issues
			itemCount = itemIndexes.size + (editingInline ? 1 : 0)
		
		
		return <div style={styles.listContent}>
			{/* ISSUE FILTERS */}
			<IssueFilters />
			
			{/* ROOT LIST - groups or issues */}
			<div style={styles.listContainer}>
				<VisibleList items={itemIndexes}
				             itemCount={itemCount}
				             itemRenderer={this.makeRenderIssueListItem()}
				             initialItemsPerPage={50}
				             itemHeight={convertRem(9.1)}
				             className="show-scrollbar"
				             
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
		
	}
	
}
