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

	renderMulti(issues:Issue[]) {
		return <div>
			{issues.length} selected issues
		</div>
	}

	renderIssue(issue:Issue) {
		return <div>
			{issue.title}
		</div>
	}

	render() {
		const {issues,theme} = this.props
		return <div>
			{issues.length === 0 ? <div/> :
				issues.length > 1 ?
					this.renderMulti(issues) :
					this.renderIssue(issues[0])
			}
		</div>
	}

}