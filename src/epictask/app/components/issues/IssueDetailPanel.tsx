/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import {Issue} from 'shared/models'
import {AppKey, RepoKey} from '../../../shared/Constants'

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn,Fill,{

	}),

	issue: makeStyle(FlexColumn,FlexScale,{

	}),

	issueMulti: makeStyle(FlexColumn,FlexScale,{

	}),

	header: makeStyle(FlexAuto,{
		title: makeStyle({
			fontSize: themeFontSize(1.8)
		}),
	}),

	body: makeStyle(FlexScale,{

	}),


	footer: makeStyle(FlexAuto,{

	}),

}

function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)

	return {
		theme: appState.theme,
		issues: repoState.selectedIssues
	}
}

/**
 * IIssueDetailPanelProps
 */

export interface IIssueDetailPanelProps {
	issues?:Issue[]
	theme?:any
}

/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/

@connect(mapStateToProps)
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {


	constructor(props = {}) {
		super(props)
	}

	renderMulti(issues:Issue[],s) {
		return <div>
			{issues.length} selected issues
		</div>
	}

	renderHeader(issue,s) {
		return <div style={s.header}>
			<div style={s.header.title}>
				{issue.title}
			</div>
		</div>
	}

	renderFooter(issue,s) {
		return <div style={s.footer}>
			<div >
				add comment here
			</div>
		</div>
	}

	renderIssue(issue:Issue,s) {
		return <div style={s.issue}>
			{this.renderHeader(issue,s)}

			{/* Issue Detail Body */}
			<div style={s.body}>
				{issue.body}
			</div>

			{this.renderFooter(issue,s)}
		</div>
	}

	render() {
		const
			{issues,theme} = this.props,
			s = mergeStyles(styles,theme.issueDetail)

		return <div style={s.root}>
			{issues.length === 0 ? <div/> :
				issues.length > 1 ?
					this.renderMulti(issues,s) :
					this.renderIssue(issues[0],s)
			}
		</div>
	}

}