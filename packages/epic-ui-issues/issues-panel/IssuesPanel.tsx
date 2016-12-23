/**
 * Created by jglanz on 5/30/16.
 */
// Imports
import { Map, List } from "immutable"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { IssueDetailPanel } from "./IssueDetailPanel"

import {
	IIssueGroup,
	getIssueGroupId,
	IIssueListItem,
	IIssueEditInlineConfig
} from "epic-models"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder
} from "epic-command-manager-ui"
import { CommonKeys, ContainerNames } from "epic-command-manager"
import { FlexColumnCenter, ThemedStyles } from "epic-styles"
import { SearchField} from "epic-ui-components/search"
import { IssuesList } from "./IssuesList"
import { getValue, unwrapRef } from "epic-global"
import IssuesPanelController from "./IssuesPanelController"
import { getIssuesPanelSelector } from "./IssuesPanelController"
import { shallowEquals, guard } from "epic-global/ObjectUtil"
import { getUIActions } from "epic-typedux/provider/ActionFactoryProvider"

import { ViewRoot } from "epic-ui-components/layout"
import IssuesPanelState from "./IssuesPanelState"
import { getIssueActions } from "epic-typedux/provider"
import { IssuesPanelSearch } from "./IssuesPanelSearch"
import { BaseIssuePanel, IBaseIssuesPanelProps } from "epic-ui-issues/issues-panel/BaseIssuePanel"


// Constants & Non-typed Components
const
	log = getLogger(__filename),
	SplitPane = require('react-split-pane'),
	NO_LABELS_ITEM = {name: 'No Labels', color: 'ffffff'}

function getPages() {
	return RouteRegistryScope.asMap() as any
}
	
	
//DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)

//region STYLES
function baseStyles(topStyles,theme,palette) {
	
	const
		{primary,accent,text,background} = palette
	
	return {
		panel: [ Styles.Fill,Styles.FlexColumn, {
			
		} ],
		panelSplitPane: [ Fill, {
			' > .Pane2': makeStyle(OverflowHidden, {})
			
		} ],
		
		noItems: [Fill,FlexColumnCenter,{
			text: [{
				color: text.secondary,
				fontWeight: 100,
				fontSize: rem(1.6),
				lineSpacing: rem(1.9),
				letterSpacing: rem(0.3),
				textTransform: 'uppercase',
				textAlign: 'center',
				
				strong: [{
					color: text.primary,
					fontWeight: 500
				}]
				
			}]
			
			
		}],
		
		
	}
}
//endregion

/**
 * IIssuesPanelProps
 */
export interface IIssuesPanelProps extends IBaseIssuesPanelProps {
	
	
	hasSelectedIssues?:boolean
	
	hasAvailableRepos?: boolean
	saving?: boolean
	editInlineConfig?: IIssueEditInlineConfig
	
	horizontalView?:boolean
	
}

export interface IIssuesPanelState {
	firstSelectedIndex?: number
	listItems?: any
	srcItems?: List<IIssueListItem<any>>
	groupsVisibility?:Map<string,boolean>
	listRef?:any
	searchFieldRef?:any
	
}


function makeSelector() {
		
	return createStructuredSelector({
		criteria: getIssuesPanelSelector(selectors => selectors.criteriaSelector),
		hasSelectedIssues: getIssuesPanelSelector(selectors => selectors.hasSelectedIssuesSelector),
		issues: getIssuesPanelSelector(selectors => selectors.issuesSelector),
		items: getIssuesPanelSelector(selectors => selectors.issueItemsSelector),
		groups: getIssuesPanelSelector(selectors => selectors.issueGroupsSelector),
		editInlineConfig: getIssuesPanelSelector(selectors => selectors.editInlineConfigIssueSelector),
		horizontalView: getIssuesPanelSelector(selectors => selectors.horizontalViewSelector),
	})
}
	
/**
 * IssuesPanel
 *
 * @class IssuesPanel
 * @constructor
 **/
@ViewRoot(IssuesPanelController,IssuesPanelState)
@connect(makeSelector)
@ThemedStyles(baseStyles, 'issuesPanel')
@CommandComponent()
export class IssuesPanel extends BaseIssuePanel<IIssuesPanelProps,IIssuesPanelState> implements ICommandComponent {
	
	/**
	 * Element refs
	 */
	refs:any
	
	shouldComponentUpdate(nextProps,nextState) {
		return !shallowEquals(this.props,nextProps,'horizontalView','hasSelectedIssues','issues','items','groups','editInlineConfig') ||
			!shallowEquals(this.state,nextState,'listRef') || !this.props.view
	}
	
	/**
	 * Command builder
	 *
	 * @param builder
	 */
	commandItems = (builder:CommandContainerBuilder) =>
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
			
			
			// TOGGLE VIEW
			.useCommand(
				Commands.ClearFilterSort,
				(cmd, event) => this.viewController.clearFilters())
	
			// TOGGLE VIEW
			.useCommand(
				Commands.ToggleIssuesPanelView,
				(cmd, event) => this.viewController.toggleView())
				
			// NEW COMMENT
			.useCommand(
				Commands.NewComment,
				(cmd, event) => {
					const
						selectedIssue = this.viewController.getSelectedIssue()
					
					getUIActions().openWindow(getPages().CommentEditDialog.makeURI(selectedIssue))
				})
			
			//MARK ISSUE FOCUSED
			.useCommand(
				Commands.ToggleFocusIssues,
				(cmd,event) => this.props.viewController.toggleSelectedAsFocused(),
				)
			
			// CLOSE ISSUES
			.useCommand(
				Commands.CloseIssues,
				(cmd,event) => this.onDelete(event),
			)
			
			// CREATE INLINE
			.useCommand(
				Commands.NewIssueInline,
				(cmd,event) => this.onEnter(event)
			)
			// ESCAPE EDIT INLINE
			.command(
				CommonKeys.Escape,
				(cmd,event) => {
					if (this.props.editInlineConfig) {
						this.viewController.setEditingInline(false)
					}
				},
				{
					overrideInput:true
				}
			)
			// LABEL ISSUES
			.useCommand(
				Commands.LabelIssues,
				(cmd,event) => getIssueActions().patchIssuesLabel(this.viewController.getSelectedIssues())
			)
			
			// MILESTONE ISSUES
			.useCommand(
				Commands.MilestoneIssues,
				(cmd,event) => getIssueActions().patchIssuesMilestone(this.viewController.getSelectedIssues())
			)
				
			// FIND/FUZZY
			.useCommand(
				Commands.FindIssues,
				this.openFindIssues
			)
			
			.make()
		
	readonly commandComponentId = ContainerNames.IssuesPanel
	
	
	
	
	/**
	 * Open issue finder
	 *
	 * @param cmdOrMenuItem
	 * @param event
	 */
	private openFindIssues = (cmdOrMenuItem,event) => {
		
		guard(() => $(ReactDOM.findDOMNode(this.state.searchFieldRef)).find('input').focus())
		// const
		// 	{searchField} = this,
		// 	inputElement = searchField && searchField.inputElement
		//
		// log.debug('Fuzzy find',searchField,inputElement)
		//
		// if (inputElement)
		// 	$(inputElement).focus()
		
	}
	
	/**
	 * Issue actions
	 *
	 * @type {IssueActionFactory}
	 */
	private issueActions = getIssueActions()
	
	
	/**
	 * Private ref for selected issue ids
	 */
	
	//private _selectedIssueIds:List<number>
	
	/**
	 * Internal select event emitter
	 *
	 * @type {SimpleEventEmitter<Function>}
	 */
	//private selectListeners = new SimpleEventEmitter<Function>()
	
	/**
	 * Get search panel
	 *
	 * @returns {SearchField}
	 */
	private get searchField():SearchField {
		return unwrapRef<SearchField>(getValue(() => this.state.searchFieldRef))
	}
	
	/**
	 * Set search panel ref
	 *
	 * @param searchFieldRef
	 */
	private setSearchFieldRef = (searchFieldRef) => this.setState({searchFieldRef})
	
	
	
	
	/**
	 * On delete pressed
	 *
	 * @param event
	 */
	private onDelete = (event) => {
		const
			selectedIssueIds = this.selectedIssueIds
		
		log.info(`OnDelete - going to remove`, selectedIssueIds)
		this.issueActions.setIssueStatus(this.viewController.getSelectedIssues(),'closed')
	}
	
	
	
	
	
	/**
	 * Open an issue (usually double click)
	 *
	 * @param event
	 * @param issue
	 */
	onIssueOpen = (event: MouseEvent, issue) => {
		log.debug(`Received issue open`,issue)
		if (!issue) {
			return
		}
		
		this.updateSelectedIssueIds(List<number>([issue.id]))
		getIssueActions().editIssue(issue)
		
	}
	
	/**
	 * On issue selection, updated selected issues
	 *
	 * @param event
	 * @param issue
	 */
	onIssueSelected = (event: MouseEvent, issue) => {
		let
			selectedIssueIds = this.selectedIssueIds,
			{items} = this.props,
			{itemIndexes} = this
		
		
		
		// Get the issue index for track of "last index"
		const
				issueIndex = this.getIssueIndex(issue),
				{firstSelectedIndex} = this.state
		
		// Set the 'first' selected index if not set
		// or no modifier
		log.info(`Issue selected`,issue,'at index',issueIndex)
		if (
				issueIndex > -1 && (
						selectedIssueIds.size === 0 ||
						(!event.shiftKey && !event.metaKey)
				)
		) {
			this.setState({firstSelectedIndex: issueIndex})
		}
		
		// Recalculate the selection block with shift
		if (event.shiftKey) {
			selectedIssueIds = this.calculateSelectedIssueIds(issueIndex, firstSelectedIndex)
		}
		
		// Toggle the issue selection if meta key used
		else if (event.metaKey) {
			
			const
				wasSelected = selectedIssueIds.includes(issue.id)
			
			selectedIssueIds = (wasSelected) ?
					selectedIssueIds.filter(id => id !== issue.id) :
					selectedIssueIds.push(issue.id) as any
			
			
		} else {
			selectedIssueIds = List<number>([issue.id])
		}
		
		
		this.updateSelectedIssueIds(selectedIssueIds, true)
		log.debug('Received issue select')
	}
	
	
	/**
	 * Is an issue group visible
	 *
	 * @param groupId
	 */
	isIssueGroupVisible(groupId: string) {
		return [null, undefined, true].includes(this.state.groupsVisibility.get(groupId))
	}
	
	
	/**
	 * Toggle issue group collapsed/expanded
	 *
	 * @param group
	 */
	toggleGroupVisible(group: IIssueGroup) {
		
		const
			groupId = getIssueGroupId(group),
			isVisible = this.isIssueGroupVisible(groupId)
		
		this.setState({
			groupsVisibility: this.state
					.groupsVisibility.set(groupId, !isVisible)
		})
	}



	
	componentWillMount() {
		this.viewController.setMounted(true)
	}
	
	componentWillUnmount() {
		this.viewController.setMounted(false)
	}
	
	
	private setListRef = (listRef) => {
		log.debug(`Setting list ref`,listRef)
		
		if (listRef)
			this.setState({listRef})
	}
	
	private makeNoContent(styles,itemsAvailable,allItemsFiltered) {
		if (itemsAvailable)
			return null
		
		if (allItemsFiltered) {
			return (<span>
					<span style={styles.noItems.text.strong}>filtered all the issues</span>
					&nbsp;in the your enabled repositories, you might want to check that
				</span>)
		} else {
			return (<span>
						<span style={styles.noItems.text.strong}>No issues exist</span>
						&nbsp;in your enabled repositories, why don't you create one
					</span>)
		}
	}
	
	/**
	 * Render the component
	 */
	render() {
		const
			{
				styles,
				issues,
				items,
				commandContainer,
				hasSelectedIssues,
				horizontalView,
				viewState
			} = this.props
		
		if (!viewState) {
			return React.DOM.noscript()
		}
			
		const
			// FOCUSED BASED ON CONTAINER
			focused = commandContainer.isFocused(),
			
			//selectedIssueIds = this.selectedIssueIds,
			
			
			// validSelectedIssueIds = selectedIssueIds
			// 		.filter(issueId =>
			// 			!_.isNil(issues.find(issue => issue.id === issueId))),

			
			itemsAvailable = items && items.size > 0,
			allItemsFiltered = !itemsAvailable && issues.size,
			
			allowResize = itemsAvailable && hasSelectedIssues, //validSelectedIssueIds && validSelectedIssueIds.size > 0,
			
			//allowResize = true,
			listMinWidth = !allowResize ? '100%' : convertRem(36.5),
			listMaxWidth = !allowResize ? '100%' : -1 * convertRem(36.5),
			
			noItemsContentNode = this.makeNoContent(styles,itemsAvailable,allItemsFiltered),
			noItemsNode = !itemsAvailable && <div style={styles.noItems}>
				<div style={styles.noItems.text}>
					{noItemsContentNode}
				</div>
			</div>
		
		
		return <CommandRoot
			tabIndex={0}
			autoFocus={true}
			component={this}
			style={styles.panel}
      id="issuesPanel">
			
			{/*<Style scopeSelector=".issuePanelSplitPane"*/}
			       {/*rules={styles.panelSplitPane}/>*/}
			
			
			<IssuesPanelSearch
				ref={this.setSearchFieldRef}
				viewController={this.viewController}
				/>
			
			
			
			{/* ISSUE SEARCH AND FILTERING */}
			{!itemsAvailable && !allItemsFiltered ? noItemsNode :
				<div style={makeStyle(
					Styles.FlexScale,
					Styles.FillWidth,
					Styles.PositionRelative,
					Styles.OverflowHidden,
					Styles.makeTransition(['flex-grow','flex-shrink','flex-basis'])
				)}>
					<SplitPane split={horizontalView ? 'horizontal' : 'vertical'}
					           allowResize={allowResize}
					           minSize={listMinWidth}
					           maxSize={listMaxWidth}
					           className='issuePanelSplitPane'>
						
						{/* LIST CONTROLS FILTER/SORT */}
						<IssuesList
							viewController={this.viewController}
							ref={this.setListRef}
							onIssueOpen={this.onIssueOpen}
							onIssueSelected={this.onIssueSelected}
							allItemsFilteredMessage={allItemsFiltered && noItemsNode}
						/>
						
						{/* ISSUE DETAIL PANEL */}
						<IssueDetailPanel viewController={this.viewController} />
					
					</SplitPane>
					
				</div>
				
			}
		</CommandRoot>
	}
	
}
