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
import {RepoKey, AppKey, DataKey, UIKey, IssueKey} from 'shared/Constants'
import {List} from 'immutable'

import {RepoState} from 'shared/actions/repo/RepoState'
import {createStructuredSelector} from 'reselect'
import {UIActionFactory} from 'shared/actions/ui/UIActionFactory'
import {Container} from 'typescript-ioc'
import {UIState} from 'shared/actions/ui/UIState'
import {IssueState, IIssueFilter, IIssueSort} from 'shared/actions/issue/IssueState'
import {createIssuesSelector} from 'shared/actions/issue/IssueSelectors'
import {IssueActionFactory} from 'shared/actions/issue/IssueActionFactory'

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
	s:any
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

const selectedIssueIdsSelector = (state) => (state.get(IssueKey) as IssueState).selectedIssueIds

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
	})
}

@connect(makeIssueItemStateToProps)
@PureRender
class IssueItem extends React.Component<IIssueItemProps,IIssueState> {

	constructor(props,context) {
		super(props,context)
	}

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
			{s,onSelected,repo} = props

		if (!issue)
			return <div/>

		const
			{labels} = issue,

			issueStyles = makeStyle(
				s.issue,
				selected && s.issueSelected,
				(selected && selectedMulti) && s.issueSelectedMulti
			),
			issueTitleStyle = makeStyle(
				s.issueTitle,
				selected && s.issueTitleSelected,
				selectedMulti && s.issueTitleSelectedMulti
			)

		return <div {...props} style={issueStyles}
		                       selected={selected}
		                       className={'animated fadeIn ' + (selected ? 'selected' : '')}
		                       onClick={(event) => onSelected(event,issue)}>

			<div style={s.issueMarkers}></div>
			<div style={s.issueDetails}>

				<div style={s.issueRepoRow}>
					<div style={s.issueRepo}>
						{Renderers.repoName(repo)}
					</div>

					{/* ASSIGNEE */}
					<Avatar user={issue.assignee}
					        style={s.issue.avatar}
					        labelPlacement='before'
					        labelStyle={s.username}
					        avatarStyle={s.avatar}/>

				</div>


				<div style={s.issueTitleRow}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={s.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={s.issueBottomRow}>

					{/* LABELS */}
					<IssueLabels labels={labels} style={s.issueLabels}/>

					{/* MILESTONE */}
					{issue.milestone && <div style={s.issueMilestone}>
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
	s?:any
}

const issuesSelector = createIssuesSelector()

function mapStateToProps(state) {
	const issueState:IssueState = state.get(IssueKey)
	const theme = getTheme(),
		issues = issuesSelector(state)

	return {
		theme,
		issues,
		issueSort: issueState.issueSort,
		selectedIssue: null,
		selectedIssueIds: selectedIssueIdsSelector(state),
		s: mergeStyles(styles, (theme) ? theme.issuesPanel : null)
	}
}


/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
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
			{s,selectedIssueIds,issues} = props



		return <IssueItem key={key}
		                  s={s}
		                  index={index}
		                  selectedIssueIds={selectedIssueIds}
		                  issues={issues}
		                  onSelected={this.onIssueSelected}/>


	}


	render() {
		const
			{selectedIssueIds,issueSort,s:themeStyles} = this.props,
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
