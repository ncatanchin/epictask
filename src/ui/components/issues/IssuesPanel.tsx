/**
 * Created by jglanz on 5/30/16.
 */

// Imports
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
	selectedIssueIdsSelector
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

// Non-typed Components
const tinycolor = require('tinycolor2')
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()



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

	issue: makeStyle(FlexRow, FlexAuto,
		FillWidth, FlexAlignStart, makeTransition(['background-color']), {

			padding:   '1.5rem 1rem 1.5rem 1rem',
			cursor:    'pointer',
			boxShadow: 'inset 0 0.4rem 0.6rem -0.6rem black',

			// Avatar component
			avatar: makeStyle({
				padding: '0'
			})
		}),


	issueSelected: makeStyle({}),

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
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?:any
	styles?:any
	issues?:Issue[]
	labels?:Label[]
	milestones?:Milestone[]
	selectedIssueIds?:number[]
	selectedIssue?:Issue

}

export interface IIssuesPanelState {
	firstSelectedIndex?:number
	issueList?:any
}

function makeMapStateToProps() {
	return createStructuredSelector({
		issues: issuesSelector,
		labels: labelsSelector,
		milestones: milestonesSelector,
		selectedIssueIds: selectedIssueIdsSelector

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
@ThemedStyles(baseStyles,'issuesPanel')
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
			{
				selectedIssueIds,
				labels,
				milestones,
				theme,
				styles
			} = this.props,
			{palette} = theme,
			allowResize = selectedIssueIds && selectedIssueIds.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)

		return <HotKeys  keyMap={KeyMaps.App} handlers={this.keyHandlers} style={styles.panel}>
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
