// Imports
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import * as React from 'react'
import { PureRender } from "epic-ui-components"
import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { availableReposSelector, ViewRoot } from "epic-typedux"
import {
	IssuesPanelController, IssuesPanelState, IssueDetailPanel, BaseIssuePanel,
	IBaseIssuesPanelProps, IBaseIssuesPanelState
} from "../issues-panel"
import { IRouterLocation } from "epic-entry-ui/routes"
import { shallowEquals } from "epic-global"
import { DialogRoot } from "epic-ui-components/layout/dialog"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ FlexColumn, FlexAuto, {} ]
}


/**
 * IIssueViewDialogProps
 */
export interface IIssueViewDialogProps extends IBaseIssuesPanelProps, IRouterLocation {
	viewController?:IssuesPanelController
	viewState?:IssuesPanelState
}

/**
 * IIssueViewDialogState
 */
export interface IIssueViewDialogState extends IBaseIssuesPanelState {
	
}

/**
 * IssueViewDialog
 *
 * @class IssueViewDialog
 * @constructor
 **/

@ViewRoot(IssuesPanelController, IssuesPanelState, {singleIssueMode: true, useLocalState: true,useAllRepoIds:true})
@connect(createStructuredSelector({
	availableRepos: availableReposSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IssueViewDialog extends BaseIssuePanel<IIssueViewDialogProps,IIssueViewDialogState> {
	
	
	/**
	 * Refs
	 */
	refs
	
	/**
	 * View controller
	 */
	get viewController() {
		return this.props.viewController
	}
	
	/**
	 * View State
	 */
	get viewState() {
		return this.props.viewState
	}
	
	
	/**
	 * Create viewer
	 *
	 * @param props
	 * @param context
	 */
	constructor(props,context) {
		super(props,context)
	}
	
	
	private initViewer(props = this.props) {
		this.viewController.loadSingleIssue(props.params.issueKey)
	}
	
	componentWillMount():void {
		this.viewController.setMounted(true)
		this.initViewer()
	}
	
	componentWillReceiveProps(nextProps:IIssueViewDialogProps) {
		if (!shallowEquals(this.props,nextProps,'params.issueKey')) {
			this.initViewer(nextProps)
		}
	}
	
	render() {
		const
			{ styles } = this.props,
			issue = this.viewController.getSelectedIssue()
		
		return <DialogRoot
			titleNode={issue && issue.title}
			styles={styles.dialog}
		>
			<IssueDetailPanel viewController={this.viewController} viewState={this.viewState} />
		</DialogRoot>
	}
	
}