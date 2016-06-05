/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {IssueDetailPanel} from './IssueDetailPanel'

// Constants
const log = getLogger(__filename)
const styles = require("./IssuesPanel.css")

/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps {

}

/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/

@CSSModules(styles)
export class IssuesPanel extends React.Component<IIssuesPanelProps,any> {

	static getInitialState() {
		return {}
	}

	constructor(props = {}) {
		super(props)
	}

	componentWillMount() {
	}

	componentDidMount() {
	}

	componentWillUnmount() {

	}


	getPanelStyles() {
		const theme = getTheme()
		return {
			backgroundColor: theme.palette.accent1Color
		}
	}

	render() {

		return <div className={styles.panel} style={this.getPanelStyles()}>
			<div styleName='list-container'>
				<IssueDetailPanel />
			</div>
		</div>
	}

}
