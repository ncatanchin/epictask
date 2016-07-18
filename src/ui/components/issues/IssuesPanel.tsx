/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'
import {Checkbox} from 'material-ui'
import {PureRender} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {Issue} from 'shared/models'
import {createStructuredSelector, createSelector} from 'reselect'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {IIssueFilter, IIssueSort} from 'shared/actions/issue/IssueState'
import {issuesSelector, issueSortAndFilterSelector, selectedIssueIdsSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {CommonKeys} from 'shared/KeyMaps'
import {Themed} from 'shared/themes/ThemeManager'
import IssueItem from 'ui/components/issues/IssueItem'
import {HotKeys} from 'react-hotkeys'

import * as KeyMaps from 'shared/KeyMaps'

// Non-typed Components
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()



const styles = {
	panel:          makeStyle(Fill, {}),
	panelSplitPane: makeStyle(Fill, {
		' > .Pane2': makeStyle(OverflowHidden,{})

	}),

	listContent: makeStyle(FlexColumn, FlexScale, Fill,OverflowHidden),
	listControls: makeStyle(FlexRow, FlexAuto, FillWidth),
	listContainer:  makeStyle(FlexColumn, FlexScale, FillWidth, {
		overflow: 'auto'
	}),

	issue: makeStyle(FlexRow, FlexAuto,
		FillWidth, FlexAlignStart, makeTransition(['background-color']), {

			padding:   '1.5rem 1rem 1.5rem 1rem',
			cursor:    'pointer',
			boxShadow: 'inset 0 0.4rem 0.6rem -0.6rem black',

			// Avatar component
			avatar: makeStyle({
				padding: '0 1rem'
			})
		}),


	issueSelected: makeStyle({}),

	issueMarkers: makeStyle(FlexColumn, FlexAuto, {
		minWidth:      '1rem',
		pointerEvents: 'none'
	}),


	issueDetails: makeStyle(FlexColumn, FlexScale, FillWidth, OverflowHidden, {
		pointerEvents: 'none'
	}),

	issueRepoRow: makeStyle(FlexRow, makeFlexAlign('stretch', 'center'), {
		pointerEvents: 'none'
	}),

	issueRepo: makeStyle(Ellipsis, FlexRow, FlexScale, {
		fontSize: themeFontSize(1),
		padding:  '0 0 0.5rem 0.5rem'
	}),

	issueTitleRow: makeStyle(FlexRowCenter, FillWidth, OverflowHidden, {
		padding:       '0 1rem 1rem 0.5rem',
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
		margin: '0.5rem 0 0.3rem 0.5rem',
	}),

	issueMilestone: makeStyle(FlexAuto, Ellipsis, {
		fontSize: themeFontSize(1),
		padding:  '0 1rem'
	}),


	issueLabels: makeStyle(FlexScale, {
		padding: '0 1rem 0 0'
	})


}


/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?:any
	issues?:Issue[]
	issueSort?:IIssueSort
	issueFilter?:IIssueFilter
	selectedIssueIds?:number[]
	selectedIssue?:Issue
	styles?:any
}

export interface IIssuesPanelState {
	firstSelectedIndex?:number
	issueList?:any
}

function makeMapStateToProps() {
	return createStructuredSelector({
		issues: issuesSelector,
		issueSort: createSelector(issueSortAndFilterSelector,({issueSort}) => issueSort),
		issueFilter: createSelector(issueSortAndFilterSelector,({issueFilter}) => issueFilter),
		selectedIssueIds: selectedIssueIdsSelector,
		styles: () =>  mergeStyles(styles, (getTheme()) ? getTheme().issuesPanel : null)

	},createDeepEqualSelector)
}



/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@Radium
@connect(makeMapStateToProps)
@Themed
@HotKeyContext()
@PureRender
export class IssuesPanel extends React.Component<IIssuesPanelProps,IIssuesPanelState> {

	uiActions:UIActionFactory = Container.get(UIActionFactory)
	issueActions:IssueActionFactory = Container.get(IssueActionFactory)




	moveUp = this.makeMoveSelector(-1)
	moveDown = this.makeMoveSelector(1)
	/**
	 * Key handlers for Issue Panel
	 */
	keyHandlers = {
		[CommonKeys.MoveUp]: this.moveUp,
		[CommonKeys.MoveDown]: this.moveDown,
		[CommonKeys.MoveUpSelect]: this.moveUp,
		[CommonKeys.MoveDownSelect]: this.moveDown,
		//[Keys.Enter]: () => this.onResultSelected(null)
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
				{issues,selectedIssueIds} = this.props,
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

			let newSelectedIssueIds = (event.shiftKey) ?
				this.calculateSelectedIssueIds(adjustedIndex,firstSelectedIndex) : // YOU ARE HERE - just map array of ids
				[issues[index].id]

			if (!event.shiftKey)
				this.setState({firstSelectedIndex:index})


			log.info('Keyed move',{
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
		// 	bounds = this.getSelectionBounds()
		//
		// let {startIndex,endIndex} = bounds
		//
		// if (issueIndex >= startIndex) {
		// 	endIndex = issueIndex
		// } else if (issue)
		//
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
				selectedIssueIds.length == 0 ||
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
		log.info('Received issue select')
	}

	/**
	 * Event handlers
	 *
	 * @param event
	 * @param checked
	 */
	onSortDirectionChanged = () => {
		return (event, checked) => {
			const issueSort = _.assign({},
				_.cloneDeep(this.issueActions.state.issueSort),
				{direction: (checked) ? 'desc' : 'asc'}
			) as any

			this.issueActions.setFilteringAndSorting(null, issueSort)
		}

	}


	/**
	 * on mount set default state
	 */
	componentWillMount = () => this.setState({firstSelectedIndex: -1})


	/**
	 * Render issue item
	 *
	 * @param index
	 * @param key
	 * @returns {any}
	 */
	renderIssue = (index, key) => {
		const
			{props} = this,
			{styles,selectedIssueIds,issues} = props



		return <IssueItem key={key}
		                  styles={styles}
		                  index={index}
		                  selectedIssueIds={selectedIssueIds}
		                  issues={issues}
		                  onSelected={this.onIssueSelected}/>


	}

	/**
	 * Render the component
	 */
	render() {
		const
			{selectedIssueIds,issueSort,styles:themeStyles} = this.props,
			allowResize = selectedIssueIds && selectedIssueIds.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)

		return <HotKeys  keyMap={KeyMaps.App} handlers={this.keyHandlers} style={themeStyles.panel}>
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>

			<SplitPane split="vertical"
			           allowResize={allowResize}
			           minSize={listMinWidth}
			           maxSize={listMaxWidth}
			           className='issuePanelSplitPane'>

				{/* LIST CONTROLS FILTER/SORT */}
				<div style={themeStyles.listContent}>
					<div style={themeStyles.listControls}>
						<Checkbox checked={issueSort.direction === 'desc'}
						          onCheck={this.onSortDirectionChanged()} /> descending
					</div>

					<div style={themeStyles.listContainer}>
						<ReactList ref={c => this.setState({issueList:c})}
						           itemRenderer={this.renderIssue}
						           itemsRenderer={(items, ref) => (
										<div ref={ref}>{items}</div>
									)}
						           length={this.props.issues.length}
						           type='simple'/>


					</div>
				</div>

				{/* ISSUE DETAIL PANEL */}
				<IssueDetailPanel />

			</SplitPane>
		</HotKeys>
	}

}
