// Imports
import * as React from 'react'
import { Map, Record, List } from "immutable"
import { connect } from 'react-redux'
import { createStructuredSelector, createSelector } from 'reselect'
import { PureRender } from 'epic-ui-components'
import { ThemedStyles } from 'epic-styles'
import { availableReposSelector, trayOpenSelector } from "epic-typedux/selectors"
import { AvailableRepo, DefaultIssueCriteria } from "epic-models"
import { ViewRoot } from "epic-ui-components/layout"
import {
	IssuesPanelState, IssuesPanelController, IssuesList, BaseIssuePanel,
	IBaseIssuesPanelProps,getIssuesPanelSelector
} from "epic-ui-issues/issues-panel"
import { TrayHeader } from "epic-ui-core/ide/TrayHeader"
import {
	CommandComponent, ICommandComponent, CommandContainerBuilder,
	ICommandContainerItems
} from "epic-command-manager-ui"
import { CommonKeys } from "epic-command-manager"




// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexColumn, Styles.FlexScale, Styles.FillHeight, {
		
	} ]
}


/**
 * IIssueTrayProps
 */
export interface IIssueTrayProps extends IBaseIssuesPanelProps {
	availableRepos?:List<AvailableRepo>
	open?:boolean
}

/**
 * IIssueTrayState
 */
export interface IIssueTrayState {
	
}

/**
 * IssueTray
 *
 * @class IssueTray
 * @constructor
 **/
@ViewRoot(IssuesPanelController, IssuesPanelState, {useLocalState: true,useAllRepoIds:true})
@connect(createStructuredSelector({
	availableRepos: availableReposSelector,
	open: trayOpenSelector,
	hasSelectedIssues: getIssuesPanelSelector(selectors => selectors.hasSelectedIssuesSelector),
	issues: getIssuesPanelSelector(selectors => selectors.issuesSelector),
	items: getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
	groups: getIssuesPanelSelector(selectors => selectors.issueGroupsSelector),
	selectedIssueIds: getIssuesPanelSelector(selectors => selectors.selectedIssueIdsSelector),
}))

@CommandComponent()
@ThemedStyles(baseStyles)
@PureRender
export class IssueTray extends BaseIssuePanel<IIssueTrayProps,IIssueTrayState> implements ICommandComponent {
	
	/**
	 * Refs
	 */
	refs:any
	
	/**
	 * Command component id
	 */
	commandComponentId = "IssueTray"
	
	/**
	 * Command builder
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder):ICommandContainerItems  =>
		builder
		//MOVEMENT
			.command(
				CommonKeys.MoveDown,
				(cmd,event) => {
					log.info(`Move down`,this)
					this.moveDown(event)
				},{
					hidden:true,
					overrideInput: true
				}
			)
			.command(
				CommonKeys.MoveDownSelect,
				(cmd,event) => this.moveDown(event),{
					hidden:true,
					overrideInput: true
				})
			.command(
				CommonKeys.MoveUp,
				(cmd,event) => this.moveUp(event),
				{
					hidden:true,
					overrideInput: true
				})
			.command(
				CommonKeys.MoveUpSelect,
				(cmd,event) => this.moveUp(event),
				{
					hidden:true,
					overrideInput: true
				})
			
			// SHOW VIEWER
			.useCommand(
				Commands.IssueViewer,
				(cmd, event) => this.viewController.showViewer())
			
			
			.make()
	
	
	private setListRef = (listRef) => {
		log.debug(`Setting list ref`,listRef)
		
		if (listRef)
			this.setState({listRef})
	}
	
	
	
	/**
	 * Create tray
	 *
	 * @param props
	 * @param context
	 */
	constructor(props:IIssueTrayProps,context) {
		super(props,context)
		
		this.state = {}
	}
	
	/**
	 * Component will mount, update view controller
	 */
	componentWillMount() {
		this.viewController.setCriteria({...DefaultIssueCriteria,onlyFocused:true})
		this.viewController.setMounted(true)
	}
	
	/**
	 * Component will unmount, update view controller
	 */
	componentWillUnmount():void {
		this.viewController.setMounted(false)
	}
	
	/**
	 * On open issue requested
	 *
	 * @param issue
	 */
	private onIssueOpen = issue => {
		this.viewController.showViewer()
	}
	
	/**
	 * On open issue selected
	 *
	 * @param issue
	 * @param event
	 */
	private onIssueSelected = (event,issue) => {
		log.info(`Issue selected: ${issue.id}`,issue)
		this.viewController.setSelectedIssueIds(List<number>([issue.id]))
	}
	
	render() {
		const { styles } = this.props
		
		return <div style={styles}>
			<TrayHeader styles={styles.header} title="Focused Issues"/>
			<div style={[Styles.FlexScale,Styles.PositionRelative]}>
			<IssuesList
				viewController={this.viewController}
				viewState={this.viewState}
				ref={this.setListRef}
				onIssueOpen={this.onIssueOpen}
				onIssueSelected={this.onIssueSelected}
				allItemsFilteredMessage={this.viewState.issues.size === 0 && 'No focused items'}
			/>
			</div>
		</div>
	}
	
}

