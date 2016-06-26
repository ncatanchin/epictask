/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'

import {PureRender, Renderers, Avatar} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import {IssueLabels} from './IssueLabels'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {AppActionFactory} from 'shared/actions/AppActionFactory'

import {Issue, Repo} from 'shared/models'
import {RepoKey, AppKey} from 'shared/Constants'
import {cloneObject} from 'shared/util'
import {List} from 'immutable'

// Non-typed Components
const ReactList = require('react-list')

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()



const styles = {
	panel:          makeStyle(Fill, {}),
	panelSplitPane: makeStyle(Fill, {
		' > .Pane2': makeStyle(OverflowHidden, {})

	}),
	listContainer:  makeStyle(FlexColumn, FlexScale, FillWidth, FillHeight, {
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
	issues:List<Issue>
	selectedIssues:List<Issue>
}

interface IIssueState {
	issue?:Issue
	selected?:boolean
	selectedMulti?:boolean
}

@PureRender
class IssueItem extends React.Component<IIssueItemProps,IIssueState> {

	constructor(props,context) {
		super(props,context)
	}

	getNewState(props) {
		//const repoState = repoActions.state

		const
			{index,issues,selectedIssues} = props
			// ,
			// {issues,selectedIssues} = repoState

		const
			issue = issues.get(index),
			selected = issue && selectedIssues.find(item => item.id === issue.id),
			selectedMulti = selectedIssues.length > 1


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
			{s,onSelected} = props

		if (!issue)
			return <div/>

		const
			{repo, labels} = issue,

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
	issues?:List<Issue>
	selectedIssues?:List<Issue>
	selectedIssue?:Issue
	s?:any
}

function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)
	const {theme} = appState

	return {
		theme,
		issues:         repoState.issues,
		selectedIssue: repoState.selectedIssue,
		selectedIssues: repoState.selectedIssues,
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
		if (event.metaKey) {
			let {selectedIssues,issues} = this.props
			const wasSelected = !_.isNil(selectedIssues.find(selectedIssue => selectedIssue.id === issue.id))
			selectedIssues = (wasSelected) ? selectedIssues.filter(selectedIssue => selectedIssue.id !== issue.id) :
				selectedIssues.push(issue) as any

			repoActions.setSelectedIssues(selectedIssues.toArray())
		} else {
			repoActions.setSelectedIssues([issue])
		}
		log.info('Received issue select')
	}


	renderIssue = (index, key) => {
		const
			{props} = this,
			{s,selectedIssues,issues} = props



		return <IssueItem key={key}
		                  s={s}
		                  index={index}
		                  selectedIssues={selectedIssues}
		                  issues={issues}
		                  onSelected={this.onIssueSelected}/>


	}

	render() {
		const
			{selectedIssues,s:themeStyles} = this.props,
			allowResize = selectedIssues.size > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5)

		//
		// 	<CSSTransitionGroup
		// ref={ref}
		// transitionName='issue'
		// transitionEnterTimeout={200}
		// transitionLeaveTimeout={200}>
		//
		// 	{items}
		//
		// 	</CSSTransitionGroup>

		return <div style={themeStyles.panel}>
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>

			<SplitPane split="vertical"
			           allowResize={allowResize}
			           minSize={listMinWidth}
			           maxSize={listMaxWidth}
			           className='issuePanelSplitPane'>

				<div style={themeStyles.listContainer}>
					<ReactList ref={c => this.setState({issueList:c})}
					           itemRenderer={this.renderIssue}
					           itemsRenderer={(items, ref) => {
					           	    return (
					           	    	<div ref={ref}>{items}</div>
					           	    )
					           }}
					           length={this.props.issues.size}
					           type='simple'/>


				</div>
				<IssueDetailPanel />
			</SplitPane>
		</div>
	}

}
