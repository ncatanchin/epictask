/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {IssueDetailPanel} from './IssueDetailPanel'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Style} from 'radium'
import * as SplitPane from 'react-split-pane'
import {Table,TableHeader,TableHeaderColumn,TableRow,TableRowColumn,TableBody,TableFooter} from 'material-ui'
import {RepoActionFactory,AppActionFactory} from 'app/actions'
import {Issue,Repo,AvailableRepo,Milestone,Label,Comment} from 'shared/models'
import {RepoKey,AppKey} from 'shared/Constants'

const Color = require('color')

// Constants
const log = getLogger(__filename)
const repoActions = new RepoActionFactory()
const appActions = new AppActionFactory()

const styles = {
	panel: makeStyle(Fill,{

	}),
	panelSplitPane: makeStyle(Fill),
	listContainer: makeStyle(FlexColumn,FlexScale,{

	}),

	issue: makeStyle()

}


/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {
	theme?:any
	issues?:Issue[]
	selectedIssues?:Issue[]
}

function mapStateToProps(state) {
	const appState = state.get(AppKey)
	const repoState = state.get(RepoKey)

	return {
		theme: appState.theme,
		issues: repoState.issues,
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

	constructor(props) {
		super(props)
	}

	onIssueSelected = (indexes) => {
		const issues = indexes.map(index => this.props.issues[index])
		repoActions.setSelectedIssues(issues)
		log.info('Received issue select')
	}


	render() {
		const
			{theme,issues,selectedIssues} = this.props,
			{palette} = theme,
			panelStyle = makeStyle(styles.panel,{backgroundColor: palette.accent4Color}),
			bodyStyle = makeStyle({
				backgroundColor: palette.accent1Color,
				color: palette.accent1ColorText
			}),
			issueStyle = makeStyle(styles.issue,{
				backgroundColor: palette.accent4Color,
				color: palette.accent4ColorText
			}),
			issueSelectedStyle = makeStyle(issueStyle,{
				backgroundColor: palette.accent4Color,
				color: palette.accent3ColorText
			}),
			issueMultiSelectedStyle = makeStyle(issueSelectedStyle,{
				backgroundColor: palette.highlightColor,
				color: palette.highlightColorText
			}),
			allowResize = selectedIssues.length > 0,
			listMinWidth = !allowResize ? '100%' : '50%',
			listMaxWidth = !allowResize ? '100%' : '80%',
			selectedIssueIds = selectedIssues.map(issue => issue.id),
			selectedMulti = selectedIssueIds.length > 1



		return <div style={panelStyle}>
			<Style scopeSelector=".issuePanelSplitPane"
			       rules={styles.panelSplitPane} />

			<SplitPane split="vertical" allowResize={allowResize} minSize={listMinWidth} maxSize={listMaxWidth} className='issuePanelSplitPane'>
				<div style={styles.listContainer}>
					<Table bodyStyle={bodyStyle} onRowSelection={this.onIssueSelected}>
						<TableHeader adjustForCheckbox={false} displaySelectAll={false}>
							<TableRow>
								<TableHeaderColumn>Title</TableHeaderColumn>
								<TableHeaderColumn>Labels</TableHeaderColumn>
							</TableRow>
						</TableHeader>
						<TableBody style={bodyStyle} displayRowCheckbox={false}>
							{issues.map(issue => {
								const
									selected = selectedIssueIds.includes(issue.id)

								return <TableRow
										key={issue.id}
										style={selectedMulti && selected ? issueMultiSelectedStyle :
											selected ? issueSelectedStyle :
											issueStyle}
										selected={selected}>
									<TableRowColumn>{issue.title}</TableRowColumn>
									<TableRowColumn>{issue.labels.map(label => label.name)}</TableRowColumn>
								</TableRow>
							})}
						</TableBody>
					</Table>

				</div>
				<IssueDetailPanel />
			</SplitPane>
		</div>
	}

}
