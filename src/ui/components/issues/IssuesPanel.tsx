/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import {Map} from 'immutable'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'
import {Checkbox,MenuItem,IconMenu,IconButton} from 'material-ui'


import {PureRender} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Issue} from 'shared/models'
import {createStructuredSelector, createSelector} from 'reselect'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {
	issuesSelector,
	issueSortAndFilterSelector,
	labelsSelector,
	milestonesSelector,
	selectedIssueIdsSelector, issuesGroupedSelector, TIssueSortAndFilter, selectedIssueSelector, issueStateSelector
} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import * as KeyMaps from 'shared/KeyMaps'
import {CommonKeys} from 'shared/KeyMaps'
import {Themed, ThemedStyles} from 'shared/themes/ThemeManager'
import IssueItem from 'ui/components/issues/IssueItem'
import {HotKeys} from 'react-hotkeys'
import {Milestone} from 'shared/models/Milestone'
import {Label} from 'shared/models/Label'
import {FlexRowCenter} from 'shared/themes/styles/CommonStyles'
import {IssueFilters} from 'ui/components/issues/IssueFilters'
import {IIssueGroup, getIssueGroupId} from 'shared/actions/issue/IIssueGroup'
import {Icon} from 'ui/components/common/Icon'
import {IssueLabelsAndMilestones} from 'ui/components/issues/IssueLabelsAndMilestones'
import {Button} from 'ui/components/common/Button'
import {IssueEditInline} from 'ui/components/issues/IssueEditInline'
import {TIssueEditInlineConfig} from 'shared/actions/issue'

// Non-typed Components
const tinycolor = require('tinycolor2')
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()

const NO_LABELS_ITEM = {name: 'No Labels',color: 'ffffff'}


const baseStyles = createStyles({
	panel:          makeStyle(Fill, {}),
	panelSplitPane: makeStyle(Fill, {
		' > .Pane2': makeStyle(OverflowHidden,{})

	}),

	listHeader: [FlexRow, FlexAuto, FillWidth,{
		padding: '0.5rem 1rem',

	}],


	list: {
		width: 400
	},
	listContent: makeStyle(FlexColumn, FlexScale, Fill,OverflowHidden),
	listContainer:  makeStyle(FlexColumn, FlexScale, FillWidth, {
		overflow: 'auto'
	}),


	/**
	 * Issue group header
	 */
	issueGroupHeader: [FlexRowCenter,FlexAuto,FillWidth,{
		padding: '1rem 0.5rem',
		boxShadow: 'inset 0.1rem 0.1rem 0.5rem rgba(0,0,0,0.4)',
		// color: rgba(255,255,255,0.4)"
		//boxShadow: "0 -2px  rgba(0,0,0,0.6)",

		spacer: [FlexScale],
		control: {
			padding: '0 1rem',
			backgroundColor: 'transparent'
		},
		labels: [FlexScale,{overflow: 'auto'}],
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
		FlexRow,
		FlexAuto,
		FillWidth,
		FlexAlignStart,
		makeTransition(['background-color']), {

			padding: '1.5rem 1rem 1.5rem 1rem',
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
		minWidth:      '1rem',
		pointerEvents: 'none'
	}),


	issueDetails: makeStyle(FlexColumn, FlexScale, OverflowHidden, {
		padding: '0 0.5rem'
		//pointerEvents: 'none'
	}),

	issueRepoRow: makeStyle(FlexRow, makeFlexAlign('stretch', 'center'), {
		pointerEvents: 'none'
	}),

	issueRepo: makeStyle(Ellipsis, FlexRow, FlexScale, {
		fontSize: themeFontSize(1),
		padding:  '0 0 0.5rem 0rem'
	}),

	issueTitleRow: makeStyle(FlexRowCenter, FillWidth, OverflowHidden, {
		padding:       '0 0 1rem 0',
		pointerEvents: 'none'
	}),

	issueTitleTime: makeStyle(FlexAuto, {
		// alignSelf: 'flex-end',
		fontSize:   themeFontSize(1),
		fontWeight: 100,
	}),

	issueTitle: makeStyle(Ellipsis, FlexScale, {
		display:    'block',
		fontWeight: 300,
		fontSize:   themeFontSize(1.4),
		padding:    '0 1rem 0 0'
	}),


	issueTitleSelected: makeStyle({
		fontWeight: 500
	}),

	issueBottomRow: makeStyle(FlexRowCenter, {
		margin: '0rem 0 0.3rem 0',
		overflow: 'auto'
	}),

	issueMilestone: makeStyle(FlexAuto, Ellipsis, {
		fontSize: themeFontSize(1),
		padding:  '0 1rem'
	}),


	issueLabels: makeStyle(FlexScale, {
		padding: '0 0 0 0',
		//overflow: 'auto',
		flexWrap: 'wrap',

		label: {
			margin: '0.5rem 0.7rem 0rem 0',
		}

	})


})


/**
 * Issue group header component
 *
 */
function IssueGroupHeader({styles,onClick,issueGroup = {} as IIssueGroup}) {
	const {groupByItem,groupBy} = issueGroup
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
				<div style={styles.issueGroupHeader.labels}>{!groupByItem ? 'Not assigned' : groupByItem.login}</div>
		}
		{/*<div style={styles.issueGroupHeader.spacer} />*/}
		<div style={styles.issueGroupHeader.stats} >
			<span style={styles.issueGroupHeader.stats.number}>
				{issueGroup.issues.length}
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
	theme?:any
	styles?:any
	issues?:Issue[]
	issuesGrouped?:IIssueGroup[]
	issueSortAndFilter?:TIssueSortAndFilter
	labels?:Label[]
	milestones?:Milestone[]
	saveError?:Error
	saving?:boolean
	selectedIssueIds?:number[]
	selectedIssue?:Issue
	editingInline?:boolean
	editInlineConfig?:TIssueEditInlineConfig

}

export interface IIssuesPanelState {
	firstSelectedIndex?:number

	issueList?:any
	issueGroupsVisibility?:Map<string,boolean>
}


/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@Radium
@connect(createStructuredSelector({
	issues: issuesSelector,
	issuesGrouped: issuesGroupedSelector,
	issueSortAndFilter: issueSortAndFilterSelector,
	labels: labelsSelector,
	milestones: milestonesSelector,
	selectedIssueIds: selectedIssueIdsSelector,
	selectedIssue: selectedIssueSelector,
	editingInline: (state) => issueStateSelector(state).editingInline,
	editInlineConfig: (state) => issueStateSelector(state).editInlineConfig,
	saving: (state) => issueStateSelector(state).issueSaving,
	saveError: (state) => issueStateSelector(state).issueSaveError
},createDeepEqualSelector))
@ThemedStyles(baseStyles,'issuesPanel')
@HotKeyContext()
@PureRender
export class IssuesPanel extends React.Component<IIssuesPanelProps,IIssuesPanelState> {

	uiActions:UIActionFactory = Container.get(UIActionFactory)
	issueActions:IssueActionFactory = Container.get(IssueActionFactory)


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
	private onEnterPressed = () => {
		const
			{
				issueSortAndFilter,
				issuesGrouped,
				issues,
				selectedIssue,
				selectedIssueIds
			} = this.props,
			{groupBy} = issueSortAndFilter.issueSort


		log.debug('Enter pressed',selectedIssueIds,selectedIssue)

		if (selectedIssue) {
			let groupIndex = -1, issueIndex = -1
			if (groupBy === 'none') {
				issueIndex = issues.findIndex(item => item.id === selectedIssue.id)
			} else {
				for (let i = 0; i < issuesGrouped.length;i++) {
					const group = issuesGrouped[i]
					const index = group.issues.findIndex(item => item.id === selectedIssue.id)
					if (index === -1)
						continue
					issueIndex = index
					groupIndex = i
					break

				}

				assert(groupIndex > -1,'Issue not in group')
			}


			assert(issueIndex > -1,'Issue index not found')

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
				groupIndex,
				issueIndex,
				issue
			)

		} else if (selectedIssueIds.length) {
			this.issueActions.setSelectedIssueIds([])
		}


	}

	/**
	 * Key handlers for Issue Panel
	 */
	keyHandlers = {
		[CommonKeys.MoveUp]: this.moveUp,
		[CommonKeys.MoveDown]: this.moveDown,
		[CommonKeys.MoveUpSelect]: this.moveUp,
		[CommonKeys.MoveDownSelect]: this.moveDown,
		[CommonKeys.Enter]: this.onEnterPressed
	}





	/**
	 * Create a move selector for key handlers
	 *
	 * @param increment
	 * @returns {(event:any)=>undefined}
	 */
	makeMoveSelector(increment:number) {

		return (event:React.KeyboardEvent) => {

			const
				{issues,selectedIssueIds,editingInline} = this.props,
				{firstSelectedIndex} = this.state,
				issueCount = issues.length

			let index =
				((firstSelectedIndex === -1) ? 0 : firstSelectedIndex) + increment

			// If more than one issue is selected then use
			// bounds to determine new selection index
			if (selectedIssueIds && selectedIssueIds.length > 1) {
				const {startIndex,endIndex} = this.getSelectionBounds()

				if (startIndex < firstSelectedIndex) {
					index = startIndex + increment
				} else {
					index = endIndex + increment
				}

			}


			const adjustedIndex = Math.max(0,Math.min(issues.length - 1,index))

			if (!issues[index]) {
				log.info('No issue at index ' + index)
				return
			}


			let newSelectedIssueIds = (event.shiftKey) ?
				this.calculateSelectedIssueIds(adjustedIndex,firstSelectedIndex) : // YOU ARE HERE - just map array of ids
				[issues[index].id]

			if (!event.shiftKey)
				this.setState({firstSelectedIndex:index})


			log.debug('Keyed move',{
				increment,
				index,
				firstSelectedIndex,
				selectedIssueIds,
				newSelectedIssueIds,
			})



			this.issueActions.setSelectedIssueIds(newSelectedIssueIds)

		}

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
		const {selectedIssueIds,issues} = this.props

		let startIndex = -1, endIndex = -1
		for (let issueId of selectedIssueIds) {
			const index = issues.findIndex(item => item.id === issueId)
			if (index === -1)
				continue

			if (startIndex === -1 || index < startIndex)
				startIndex = index

			if (endIndex === -1 || index > endIndex)
				endIndex = index
		}

		return {startIndex,endIndex}
	}


	calculateSelectedIssueIds(issueIndex, firstSelectedIndex) {
		const
			{issues} = this.props

		let startIndex = Math.max(0,Math.min(issueIndex,firstSelectedIndex))
		let endIndex = Math.min(issues.length - 1,Math.max(issueIndex,firstSelectedIndex))

		return issues
			.slice(startIndex,endIndex + 1)
			.map(issue => issue.id)
	}

	/**
	 * On issue selection, updated selected issues
	 *
	 * @param event
	 * @param issue
	 */
	onIssueSelected = (event:MouseEvent, issue) => {
		let {selectedIssueIds,issues} = this.props

		// Get the issue index for track of "last index"
		const
			issueIndex = issues.findIndex(item => item.id === issue.id),
			{firstSelectedIndex} = this.state

		// Set the 'first' selected index if not set
		// or no modifier
		if (
			issueIndex > -1 && (
				selectedIssueIds.length === 0 ||
				(!event.shiftKey && !event.metaKey)
			)
		) {
			this.setState({firstSelectedIndex:issueIndex})
		}

		// Recalculate the selection block with shift
		if (event.shiftKey) {
			selectedIssueIds = this.calculateSelectedIssueIds(issueIndex,firstSelectedIndex)
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


		this.issueActions.setSelectedIssueIds(selectedIssueIds)
		log.debug('Received issue select')
	}


	/**
	 * Is an issue group visible
	 *
	 * @param groupId
	 */
	isIssueGroupVisible(groupId:string) {
		return [null,undefined,true].includes(this.state.issueGroupsVisibility.get(groupId))
	}


	/**
	 * Toggle issue group collapsed/expanded
	 *
	 * @param group
	 */
	toggleGroupVisible(group:IIssueGroup) {

		const groupId = getIssueGroupId(group),
			isVisible = this.isIssueGroupVisible(groupId)

		this.setState({
			issueGroupsVisibility: this.state
				.issueGroupsVisibility.set(groupId,!isVisible)
		})
	}


	/**
	 * on mount set default state
	 */
	componentWillMount = () => this.setState({
		issueGroupsVisibility: Map<string,boolean>(),
		firstSelectedIndex: -1
	})


	/**
	 * Make issue render
	 *
	 * @param issueGroup
	 * @param issueGroupIndex
	 */
	makeRenderIssue(issueGroup:IIssueGroup = null,issueGroupIndex:number = null) {
		/**
		 * Render issue item
		 *
		 * @param index
		 * @param key
		 * @returns {any}
		 */
		return (index, key) => {
			const {
				styles,
				selectedIssueIds,
				issues,
				issuesGrouped,
				issueSortAndFilter,
				saveError,
				saving,
				labels,
				milestones,
				editingInline,
				editInlineConfig
			} = this.props


			const {groupBy} = issueSortAndFilter.issueSort

			let showInline = false

			if (editingInline) {
				const {groupIndex,issueIndex} = editInlineConfig
				if ((issueGroup && groupIndex === issueGroupIndex) || !issueGroup) {
					if (index > issueIndex) {
						index--
					} else if (index === issueIndex) {
						showInline = true
					}
				}
			}

			return showInline ?
				// Inline issue editor
				<IssueEditInline key={key}>
					inline create here
				</IssueEditInline> :

				// Issue item
				<IssueItem key={key}
			                  styles={styles}
			                  index={index}
			                  selectedIssueIds={editingInline ?
			                    [] :
			                    selectedIssueIds}
			                  issues={issueGroup ? issueGroup.issues : issues}
			                  groupBy={groupBy}
			                  onSelected={this.onIssueSelected}/>

		}
	}


	renderGroup = (index, key) => {
		const {
			styles,
			selectedIssueIds,
			issues,
			issuesGrouped,
			issueSortAndFilter,
			editingInline,
			editInlineConfig
		} = this.props



		const {groupBy} = issueSortAndFilter.issueSort

		const group = issuesGrouped[index],
			groupByItem = group.groupByItem,
			isVisible = this.isIssueGroupVisible(getIssueGroupId(group))


		let itemCount = !isVisible ? 0 : group.size +
			(editingInline &&
				_.get(editInlineConfig,'groupIndex',-1) === index ?
					1 : 0)

		const groupListRenderer = (items, ref) => <div>
			<IssueGroupHeader
				onClick={() => this.toggleGroupVisible(group)}
				styles={styles}
				issueGroup={group}/>

			<div ref={ref} style={{overflow: 'hidden'}}>
				{items}
			</div>
		</div>


		return <ReactList itemRenderer={this.makeRenderIssue(group,index)}
		                  itemsRenderer={groupListRenderer}
		                  length={itemCount}
		                  type='simple'/>


	}

	/**
	 * Render the component
	 */
	render() {
		const
			{
				selectedIssueIds,
				labels,
				milestones,
				theme,
				styles,
				issues,
				issuesGrouped,
				issueSortAndFilter,
				editingInline,
				editInlineConfig
			} = this.props,
			{palette} = theme,
			{groupBy} = issueSortAndFilter.issueSort

		const validSelectedIssueIds = selectedIssueIds
			.filter(issueId => !_.isNil(issues.find(item => item.id === issueId)))

		const
			allowResize = validSelectedIssueIds && validSelectedIssueIds.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)

		const itemCount = (groupBy === 'none') ?
			issues.length + (editingInline ? 1 : 0):
			issuesGrouped.length



		return <HotKeys
				keyMap={KeyMaps.App}
				id="issuesPanel"
				handlers={this.keyHandlers}
				style={styles.panel}>
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>

			<SplitPane split="vertical"
			           allowResize={allowResize}
			           minSize={listMinWidth}
			           maxSize={listMaxWidth}
			           className='issuePanelSplitPane'>

				{/* LIST CONTROLS FILTER/SORT */}
				<div style={styles.listContent}>
					<IssueFilters />

					<div style={styles.listContainer}>
						<ReactList ref={c => this.setState({issueList:c})}
						           itemRenderer={groupBy === 'none' ? this.makeRenderIssue() : this.renderGroup}
						           itemsRenderer={(items, ref) => (
										<div ref={ref}>{items}</div>
									)}
						           length={itemCount}
						           type='simple'/>


					</div>
				</div>

				{/* ISSUE DETAIL PANEL */}
				<IssueDetailPanel />

			</SplitPane>
		</HotKeys>
	}

}
