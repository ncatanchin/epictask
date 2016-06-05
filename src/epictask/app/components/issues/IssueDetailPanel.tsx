/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'

// Constants
const log = getLogger(__filename)
const styles = require("./IssueDetailPanel.css")

/**
 * IIssueDetailPanelProps
 */
export interface IIssueDetailPanelProps {

}

/**
 * IssueDetailPanel
 *
 * @class IssueDetailPanel
 * @constructor
 **/

@CSSModules(styles)
export class IssueDetailPanel extends React.Component<IIssueDetailPanelProps,any> {

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

	render() {
		return <div/>
	}

}