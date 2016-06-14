/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as moment from 'moment'
import * as React from 'react'
import * as PureRenderMixin from 'react-addons-pure-render-mixin'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'

import {Renderers,Avatar} from '../common'
import {IssueDetailPanel} from './IssueDetailPanel'
import {IssueLabels} from './IssueLabels'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {AppActionFactory} from 'app/actions/AppActionFactory'

import {Issue,Repo} from 'shared/models'
import {RepoKey, AppKey} from 'shared/Constants'

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()
const appActions = new AppActionFactory()


const styles = {
	panel:          makeStyle(Fill, {}),
	panelSplitPane: makeStyle(Fill),
	listContainer:  makeStyle(FlexColumn, FlexScale,FillWidth,FillHeight,{
		overflow: 'auto'
	}),

	issue: makeStyle(FlexRow, FlexAuto,
		FillWidth,FlexAlignStart, makeTransition(['background-color']),{

		padding: '1.5rem 1rem 1.5rem 1rem',
		cursor: 'pointer',
		boxShadow: 'inset 0 0.4rem 0.6rem -0.6rem black',

		// Avatar component
		avatar: makeStyle({
			padding: '0 1rem'
		})
	}),


	issueSelected: makeStyle({

	}),

	issueMarkers: makeStyle(FlexColumn, FlexAuto, {
		minWidth: '1rem',
		pointerEvents: 'none'
	}),



	issueDetails: makeStyle(FlexColumn, FlexScale, FillWidth,OverflowHidden, {
		pointerEvents: 'none'
	}),

	issueRepoRow:makeStyle(FlexRow,makeFlexAlign('stretch','center'),{
		pointerEvents: 'none'
	}),

	issueRepo: makeStyle(Ellipsis,FlexRow,FlexScale,{
		fontSize: themeFontSize(1),
		padding: '0 0 0.5rem 0.5rem'
	}),

	issueTitleRow: makeStyle(FlexRowCenter,FillWidth,OverflowHidden,{
		padding:  '0 1rem 1rem 0.5rem',
		pointerEvents: 'none'
	}),

	issueTitleTime: makeStyle(FlexAuto,{
		// alignSelf: 'flex-end',
		fontSize: themeFontSize(1),
		fontWeight: 100,
	}),

	issueTitle:   makeStyle(Ellipsis,FlexScale,{
		display: 'block',
		fontWeight: 300,
		fontSize: themeFontSize(1.4),
		padding: '0 1rem 0 0'
	}),


	issueTitleSelected: makeStyle({
		fontWeight: 500
	}),

	issueBottomRow: makeStyle(FlexRowCenter,{
		margin: '0.5rem 0 0.3rem 0.5rem',
	}),

	issueMilestone: makeStyle(FlexAuto,Ellipsis,{
		fontSize: themeFontSize(1),
		padding: '0 1rem'
	}),



	issueLabels: makeStyle(FlexScale,{
		padding: '0 1rem 0 0'
	})


}


/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?:any
	issues?:Issue[]
	selectedIssues?:Issue[]
	repos?:Repo[]
}

function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)

	return {
		repos: repoState.repos,
		theme:          appState.theme,
		issues:         repoState.issues,
		selectedIssues: repoState.selectedIssues
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
export class IssuesPanel extends React.Component<IIssuesPanelProps,any> {

	shouldComponentUpdate:Function


	constructor(props) {
		super(props)

		this.shouldComponentUpdate = PureRenderMixin.shouldComponentUpdate.bind(this)
	}

	onIssueSelected = (event, issue) => {
		if (event.metaKey) {
			let {selectedIssues} = this.props
			const wasSelected = !_.isNil(selectedIssues.find(selectedIssue => selectedIssue.id === issue.id))
			selectedIssues = (wasSelected) ? selectedIssues.filter(selectedIssue => selectedIssue.id !== issue.id) :
				selectedIssues.concat([issue])

			repoActions.setSelectedIssues(selectedIssues)
		} else {
			repoActions.setSelectedIssues([issue])
		}
		log.info('Received issue select')
	}




	renderIssue(issue, s) {
		const
			{selectedIssues,repos,theme} = this.props,
			repo = repos.find(repo => repo.id === issue.repoId),
			selectedIssueIds = selectedIssues.map(issue => issue.id),
			selectedMulti = selectedIssueIds.length > 1,
			selected = selectedIssueIds.includes(issue.id),

			issueStyles = [
				s.issue,
				selected  && s.issueSelected,
				(selected && selectedMulti) && s.issueSelectedMulti
			],
			issueTitleStyle = [
				s.issueTitle,
				selected && s.issueTitleSelected,
				selectedMulti && s.issueTitleSelectedMulti
			]

		return <div key={issue.id}
		            style={issueStyles}
		            selected={selected}
		            onClick={(event) => this.onIssueSelected(event,issue)}>

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
					        avatarStyle={s.avatar} />

				</div>


				<div style={s.issueTitleRow}>
					<div style={issueTitleStyle}>{issue.title}</div>
					<div style={s.issueTitleTime}>{moment(issue.updated_at).fromNow()}</div>
				</div>

				<div style={s.issueBottomRow}>

					{/* LABELS */}
					<IssueLabels labels={issue.labels} style={s.issueLabels}/>

					{/* MILESTONE */}
					{issue.milestone && <div style={s.issueMilestone}>
						{issue.milestone.title}
					</div>}
				</div>
			</div>
		</div>

	}

	render() {
		const
			{theme, issues, selectedIssues} = this.props,
			allowResize = selectedIssues.length > 0,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5),
			themeStyles = mergeStyles(styles, theme.issuesPanel)

		return <div style={themeStyles.panel}>
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane}/>

			<SplitPane split="vertical"
			           allowResize={allowResize}
			           minSize={listMinWidth}
			           maxSize={listMaxWidth}
			           className='issuePanelSplitPane'>

				<div style={themeStyles.listContainer}>
					<CSSTransitionGroup transitionName='issue'
					                    transitionEnterTimeout={200}
					                    transitionLeaveTimeout={200}>
						{issues.map(issue => this.renderIssue(issue, themeStyles))}
					</CSSTransitionGroup>

				</div>
				<IssueDetailPanel />
			</SplitPane>
		</div>
	}

}
