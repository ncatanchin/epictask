/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'
import {Checkbox} from 'material-ui'

import {PureRender, Renderers, Avatar} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import {IssueLabels} from './IssueLabels'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'

import {Issue, Repo} from 'shared/models'
import {DataKey, IssueKey} from 'shared/Constants'
import {createStructuredSelector,createSelector} from 'reselect'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {IssueState, IIssueFilter, IIssueSort} from 'shared/actions/issue/IssueState'
import {issuesSelector,issueSortAndFilterSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import filterProps from 'react-valid-props'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'

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



interface IIssueItemProps extends React.DOMAttributes {
	index:number
	styles:any
	onSelected:(event:any, issue:Issue) => void
	issues:Issue[]
	repoId?:number
	repo?:Repo
	selectedIssueIds?:number[]
}

interface IIssueState {
	issue?:Issue
	selected?:boolean
	selectedMulti?:boolean
}

const selectedIssueIdsSelector = _.memoize((state) => (state.get(IssueKey) as IssueState).selectedIssueIds)

/**
 * Create a new issue item to state => props mapper
 *
 * @returns {any}
 */
const makeIssueItemStateToProps = () => {
	return createStructuredSelector({
		repo: (state,{issues,index}) => {
			let issue = null,repo = null
			if (issues && (issue = issues[index])) {
				const {repoId} = issue
				repo = state.get(DataKey).models.get(Repo.$$clazz).get(`${repoId}`)
			}
			return repo
		},
		selectedIssueIds: selectedIssueIdsSelector
	},createDeepEqualSelector)
}

@connect(makeIssueItemStateToProps)
@PureRender
class IssueItem extends React.Component<IIssueItemProps,IIssueState> {


	getNewState(props:IIssueItemProps) {
		//const repoState = repoActions.state

		const
			{index,issues,selectedIssueIds} = props

		const
			issue = issues[index],
			selected = issue && selectedIssueIds && selectedIssueIds.includes(issue.id),
			selectedMulti = selectedIssueIds.length > 1


		return {
			issue,selected,selectedMulti
		}
	}

	componentWillMount() {
		this.setState(this.getNewState(this.props))
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	render() {
		const
			{props,state} = this,
			{issue, selectedMulti, selected} = state,
			{styles,onSelected,repo} = props

		if (!issue)
			return <div/>

		const
			{labels} = issue,

			issueStyles = makeStyle(
				styles.issue,
				selected && styles.issueSelected,
				(selected && selectedMulti) && styles.issueSelectedMulti
			),
			issueTitleStyle = makeStyle(
				styles.issueTitle,
				selected && styles.issueTitleSelected,
				selectedMulti && styles.issueTitleSelectedMulti
			)

		return <div {...filterProps(props)} style={issueStyles}
		                       selected={selected}
		                       className={'animated fadeIn ' + (selected ? 'selected' : '')}
		                       onClick={(event) => onSelected(event,issue)}>

			<div style={styles.issueMarkers}></div>
			<div style={styles.issueDetails}>

				<div style={styles.issueRepoRow}>
					<div style={styles.issueRepo}>
						{Renderers.repoName(repo)}
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={styles.issue.avatar}
					        labelPlacement='before'
					        labelStyle={styles.username}
					        avatarStyle={styles.avatar}/>

				</div>


				<div style={styles.issueTitleRow}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={styles.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={styles.issueBottomRow}>

					{/* LABELS */}
					<IssueLabels labels={labels} style={styles.issueLabels}/>

					{/* MILESTONE */}
					{issue.milestone && <div style={styles.issueMilestone}>
						{issue.milestone.title}
					</div>}
				</div>
			</div>
		</div>

	}
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


function makeMapStateToProps() {
	return createStructuredSelector({
		theme: () => getTheme(),
		issues: issuesSelector,
		issueSort: createSelector(issueSortAndFilterSelector,({issueSort}) => issueSort),
		issueFilter: createSelector(issueSortAndFilterSelector,({issueFilter}) => issueFilter),
		selectedIssueIds: selectedIssueIdsSelector,
		styles: () =>  mergeStyles(styles, (getTheme()) ? getTheme().issuesPanel : null)

	})
}



/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@Radium
@connect(makeMapStateToProps)
@PureRender
@HotKeyContext
export class IssuesPanel extends React.Component<IIssuesPanelProps,any> {

	uiActions:UIActionFactory = Container.get(UIActionFactory)
	issueActions:IssueActionFactory = Container.get(IssueActionFactory)

	constructor(props) {
		super(props)


	}

	componentWillMount() {
		this.setState({lastIssues:this.props.issues})
	}

	componentWillReceiveProps(nextProps) {
		const state = this.state || {},
			{issueList,lastIssues} = state,
			{issues} = nextProps.issues

		if (issueList && lastIssues && lastIssues !== issues) {
			this.setState({lastIssues:issues})
			issueList.forceUpdate()
		}
	}


	onIssueSelected = (event, issue) => {
		let {selectedIssueIds,issues} = this.props

		if (event.metaKey) {

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


	render() {
		const
			{selectedIssueIds,issueSort,styles:themeStyles} = this.props,
			allowResize = selectedIssueIds && selectedIssueIds.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)

		return <div style={themeStyles.panel}>
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
		</div>
	}

}
