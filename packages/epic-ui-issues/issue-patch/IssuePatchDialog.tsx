/**
 * Created by jglanz on 7/24/16.
 */
// Imports
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { PureRender, Form, DialogRoot, createSaveCancelActions, ChipsField } from "epic-ui-components"
import { getValue, guard } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Issue, User, Label, Milestone } from "epic-models"
import { getUIActions } from "epic-typedux"
import { CommandType, ContainerNames, CommonKeys } from "epic-command-manager"
import { IssueMultiInlineList } from "../issues-panel/IssueMultiInlineList"
import { IssuePatchModes } from "../issues-panel/IssuesPanelState"
import { getIssueActions } from "epic-typedux/provider"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"
import IssuePatchController from "./IssuePatchController"
import { IssuePatchState } from "./IssuePatchState"
import { labelsSelector, assigneesSelector, milestonesSelector } from "epic-typedux/selectors"
import { CommandContainerBuilder, CommandComponent, CommandRoot } from "epic-command-manager-ui"


// Constants
const
	log = getLogger(__filename),
	tinycolor = require('tinycolor2')

log.setOverrideLevel(LogLevel.DEBUG)


/**
 * Add component styles
 */
function baseStyles(topStyles, theme, palette) {
	
	const
		{text,primary,accent,secondary} = palette
	
	return [ FlexColumnCenter, Fill, {
		root: [Fill,FlexColumnCenter,FlexScale,{
			paddingLeft: '15%',
			paddingBottom: '10%',
			paddingRight: '15%',
			paddingTop: '10%'
		}],
			
		
		titleBar: [ {
			label: [ FlexRowCenter, {
				fontSize: rem(1.6),
				
				repo: [ makePaddingRem(0, 0.6, 0, 0), {} ],
				
				number: [ {
					paddingTop: rem(0.3),
					fontSize: rem(1.4),
					fontWeight: 100,
					color: text.secondary
				} ]
			} ]
		} ],
		
		title: [ {
			
			issues: [ FlexRow, FillWidth, OverflowAuto, {
				fontSize: rem(1),
				
				number: [ {
					fonStyle: 'italic',
					fontWeight: 400
				} ],
				
				title: [ {
					fontWeight: 300
				} ]
			} ],
			
		} ],
		
		input: [FillWidth,makeMarginRem(1,0),FlexScale,{
			
		}],
		
		labelsAndMilestones: [FillWidth,{
			
		}],
		
		issues: [FillWidth,FlexScale,FlexColumnCenter,{
			
			list:[Fill,{
				//maxWidth: '70%',
				//maxHeight: '50%'
			}]
		}]
		
	} ]
	
}


/**
 * Acceptable modes
 */

export const IssuePatchFns = {
	[IssuePatchModes.Label]: (labels) => ({ labels: labels.map(label => ({ action: 'add', label })) }),
	[IssuePatchModes.Milestone]: (milestones /* always length 1 */) => ({ milestone: milestones[ 0 ] }),
	[IssuePatchModes.Assignee]: (assignees /* always length 1 */) => ({ assignee: assignees[ 0 ] })
}

/**
 * IIssuePatchDialogProps
 */
export interface IIssuePatchDialogProps extends IThemedAttributes {
	saving?:boolean
	saveError?:Error
		
	availableAssignees?:List<User>
	availableMilestones?:List<Milestone>
	availableLabels?:List<Label>
	
	viewController?:IssuePatchController
	viewState?:IssuePatchState
}

/**
 * IIssuePatchDialogState
 */
export interface IIssuePatchDialogState {
	newItems?:IChipItem[]
	query?:string
	allItems?:IChipItem[]
	typeAheadRef?:any
}

/**
 * IssuePatchDialog
 *
 * @class IssuePatchDialog
 * @constructor
 **/


@connect(createStructuredSelector({
	availableAssignees: assigneesSelector,
	availableLabels: labelsSelector,
	availableMilestones: milestonesSelector
}))
@ViewRoot(IssuePatchController,IssuePatchState)
@CommandComponent()
@ThemedStyles(baseStyles, 'issuePatchDialog')
@PureRender
export class IssuePatchDialog extends React.Component<IIssuePatchDialogProps,IIssuePatchDialogState> {
	
	/**
	 * Tracks refs
	 */
	refs:any
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(
				CommonKeys.Escape,
				this.hide
			)
			.make()
	
	commandComponentId = ContainerNames.IssuePatchDialog
	
	private get viewState():IssuePatchState {
		return getValue(() => this.viewController.getState())
	}
	
	private get viewController() {
		return getValue(() => this.props.viewController)
	}
	
	get mode():TIssuePatchMode {
		return getValue(() => this.viewState.mode)
	}
	
	/**
	 * Get the form object
	 *
	 * @returns {IForm}
	 */
	get form():IForm {
		return this.refs.form as IForm
	}
	
	/**
	 * Get current issues
	 *
	 * @returns {T}
	 */
	get issues() {
		return getValue(() => this.viewState.issues,List<Issue>())
	}
	
	/**
	 * Get currently selected new items
	 *
	 * @returns {any}
	 */
	get newItems() {
		return _.get(this.state, 'newItems', [])
	}
	
	/**
	 * Get query from state
	 *
	 * @returns {any}
	 */
	get query() {
		return _.get(this.state, 'query', "")
	}
	
	get typeAheadRef() {
		return _.get(this.state, 'typeAheadRef', "")
	}
	
	setTypeAheadRef = (typeAheadRef) => this.setState({ typeAheadRef })
	
	/**
	 * Hide and focus on issue panel
	 */
	hide = () => getUIActions().closeWindow()
	
	/**
	 * onSave
	 *
	 * @param event
	 */
	onSave = async (event = null) => {
		if (this.viewState.saving)
			return
		
		let newItems = getValue(() => this.state.newItems, [])
		
		// For users, unwrap
		if (this.mode === IssuePatchModes.Assignee)
			newItems = newItems.map(it => it.data)
		
		const
			patch = IssuePatchFns[ this.mode ](newItems)
		
		log.info('Applying patch to issue', patch)
		
		await getIssueActions().applyPatchToIssues(
			patch,
			this.mode !== 'Label',
			this.issues
		)
		
		getUIActions().closeWindow()
	}
	
	
	
	/**
	 * on form valid
	 *
	 * @param values
	 */
	private onFormValid = (values:IFormFieldValue[]) => {
		log.debug(`onValid`,values)
	}
	
	/**
	 * On form invalid
	 *
	 * @param values
	 */
	private onFormInvalid = (values:IFormFieldValue[]) => {
		log.debug(`onInvalid`,values)
	}
	
	/**
	 * On submit when the form is valid
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	private onFormValidSubmit = (form:IForm,model:any,values:IFormFieldValue[]) => {
		return this.onSave()
	}
	
	/**
	 * Submit the form
	 */
	private submit = () => guard(() => this.form.submit())
	
	/**
	 * On item selected, if the patch mode is NOT Label
	 * then this will call save
	 *
	 * @param item - MenuItem DataSource element
	 */
	onItemSelected = (item:IChipItem) => {
		const
			{ mode } = this
		
		log.info(`Item selected`, item)
		
		// Update newItems
		let newItems = getValue(() => this.state.newItems,[]).concat([item])
		
		// Ensure unique
		newItems = _.uniqBy(newItems,'id')
		
		
		this.setState(
			{ newItems },
			
			// After new items are set
			// Update the state & if mode isnt Label
			// Trigger save
			() => {
				this.updateState(this.props)
				if (mode !== IssuePatchModes.Label)
					this.onSave()
			}
		)
		
		
	}
	
	/**
	 * On input changed
	 *
	 * @param newQuery
	 */
	onInputChanged = (newQuery) => {
		log.info('Query updated', newQuery)
		
		this.setState({ query: newQuery }, () => this.updateState(this.props))
		
	}
	
	
	/**
	 * On new item remove
	 *
	 * @param item
	 */
	onItemRemoved = (item) => {
		log.info(`New item removed: `, item)
		
		this.setState({
			newItems: this.newItems.filter(it => it.id !== item.id)
		})
	}
	
	/**
	 * Make milestones datasource
	 *
	 * @param props
	 * @param repoIds
	 * @returns {{item: Milestone, text: string, value: any}[]}
	 */
	makeMilestoneItems(props:IIssuePatchDialogProps, repoIds) {
		
		const
			{ availableMilestones } = props,
			{ query, newItems,issues } = this,
			items = availableMilestones
			
			// Filter out repos that don't apply to these issues
				.filter((item:Milestone) => (
					// In current repo and not selected
					repoIds.includes(item.repoId) &&
					!newItems.includes(item) &&
					
					// // Query match
					// (_.isEmpty(query) || _.toLower(item.title).indexOf(_.toLower(query)) > -1) &&
					//
					// Label does not already exist on every item
					!issues.every((issue:Issue) => _.get(issue, 'milestone.id') === item.id)
				))
				
				// Convert to JS Array
				.toArray()
		
		
		log.debug('new milestone data source =', items,availableMilestones,newItems,issues)
		return items
	}
	
	/**
	 * Create labels datasource
	 *
	 * @param props
	 * @param repoIds
	 * @returns {{item: Label, text: string, value: any}[]}
	 */
	makeLabelItems(props:IIssuePatchDialogProps, repoIds) {
		
		const
			{ availableLabels } = props,
			{ query, newItems,issues } = this,
			
			items = availableLabels
			
			// Filter out repos that dont apply to these issues
				.filter((item:Label) => (
					
					// In current repo and not selected
					repoIds.includes(item.repoId) && !newItems.includes(item) &&
					
					// Query match
					(_.isEmpty(query) || _.toLower(item.name).indexOf(_.toLower(query)) > -1) &&
					
					// Label does not already exist on every item
					!issues.every((issue:Issue) => !_.isNil((issue.labels || []).find(it => it.url === item.url)))
				
				))
				
				// Convert to JS Array
				.toArray()
			
			
		log.debug('new label data source =', items)
		return items
	}
	
	
	/**
	 * Crate assignee data source for issues
	 *
	 * @param props
	 * @param repoIds
	 * @returns {any}
	 */
	makeAssigneeItems(props:IIssuePatchDialogProps, repoIds) {
		
		const
			{ issues } = this,
			collaborators = issues
				.reduce((allUsers, issue:Issue) => {
					
					issue.collaborators.forEach(user => allUsers[ user.id ] = user)
					return allUsers
				}, {} as {[id:string]:User}),
			
			
			// Convert to array
			items = Object
				.values(collaborators)
				.map((user:User) => ({
					id: user.id,
					label: user.login,
					iconImageUrl: user.avatar_url,
					data: user
				}))
				// IF SOMEONE IS ALREADY ASSIGN TO ALL FILTER OUT - DISABLED
				// .filter((item:User) =>
				// 	!issues.every((issue:Issue) => _.get(issue, 'assignee.id') === item.id))
		
		log.debug(`Assignee data source`, items, 'from', collaborators, 'for issues', issues)
		
		return items
		
	}
	
	/**
	 * Update the component state, create data source,
	 * options, etc
	 *
	 * @param props
	 */
	updateState(props:IIssuePatchDialogProps) {
		const
			viewState = props.viewState
		log.debug(`Updating state, viewState = `,viewState)
		if (!viewState || !viewState.mode || !viewState.issues.size)
			return
		
		const
			
			{mode,issues} = viewState,
			
			// Get the repo ids for the selected issues only
			repoIds = _.nilFilter(_.uniq(issues.map(issue => issue.repoId).toArray()))
		
		log.debug(`Making datasource for mode`,mode,`repoIds`,repoIds)
		
		const
			
			// Now get the datasource
			allItems = (mode === 'Milestone') ?
				this.makeMilestoneItems(props, repoIds) : (mode === 'Label') ?
				this.makeLabelItems(props, repoIds) :
				this.makeAssigneeItems(props, repoIds)
		
		this.setState({ allItems })
		
	}
	
	/**
	 * Before mount update the state
	 */
	componentWillMount = () => {
		this.viewController.setMounted(
			true,
			this.props,
			() => this.updateState(this.props)
		)
	}
	
	
	/**
	 * Update state with new props
	 *
	 * @param newProps
	 */
	componentWillReceiveProps = (newProps) => {
		this.updateState(newProps)
	}
	
	/**
	 * Chip search filter
	 *
	 * @param item
	 * @param query
	 * @returns {boolean}
	 */
	private chipFilter = (item:IChipItem, query:string):boolean => {
		const
			allText = (item.name || '') + '||' + (item.label || '') + '||' + (item.title || '')
		
		return _(allText).toLower().includes(_.toLower(query))
	}
	
	/**
	 * Render root
	 *
	 * @returns {any}
	 */
	render() {
		const
			{
				issues,
				mode
			} = this,
			{
				theme,
				styles,
				saving,
				palette
			} = this.props,
			{allItems} = this.state,
			newItems = this.newItems,
			
			title = mode === IssuePatchModes.Label ? 'Add Label' :
				mode === IssuePatchModes.Assignee ? 'Assign Issues' :
					'Set Milestone',
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				{title}
			</div>,
			titleActionNodes = createSaveCancelActions(theme, palette, this.submit, this.hide)
		
		return <CommandRoot
			id={ContainerNames.IssuePatchDialog}
			component={this}
			style={makeStyle(Fill)}>
			<DialogRoot
			titleNode={titleNode}
			titleActionNodes={titleActionNodes}
			saving={saving}
			style={styles}>
			<Form
				id="issue-patch-form"
				ref="form"
				submitOnCmdCtrlEnter={true}
				onInvalid={this.onFormInvalid}
				onValid={this.onFormValid}
				onValidSubmit={this.onFormValidSubmit}
				styles={styles.root}>
				
				<div style={styles.issues}>
					<IssueMultiInlineList issues={List<Issue>(issues)} style={styles.issues.list}/>
				</div>
				
				{/*onEscape={this.hide}*/}
				<ChipsField
					id={`issue-patch-chips`}
					style={FillWidth}
					maxSearchResults={10}
					autoFocus
					filterChip={this.chipFilter}
					allChips={allItems}
					selectedChips={newItems}
					onChipSelected={this.onItemSelected}
					onChipRemoved={this.onItemRemoved}
					keySource={(item:Label) => item.id}
					
					hint={title}
					
					
					
				
				/>
				
				{/*<IssueLabelsAndMilestones*/}
				{/*style={makeStyle(styles.labelsAndMilestones)}*/}
				{/*labels={mode === IssuePatchModes.Label && newItems}*/}
				{/*milestones={mode === IssuePatchModes.Milestone && newItems}*/}
				{/*showIcon={true}*/}
				{/*onRemove={this.onNewItemRemove}*/}
				{/*labelStyle={{}}*/}
			
			{/*/>*/}
			
			{/*{this.state.dataSource &&*/}
			{/*<SearchField*/}
				{/*ref={this.setTypeAheadRef}*/}
				{/*style={styles.input}*/}
				{/*autoFocus={true}*/}
				{/*fullWidth={true}*/}
				{/*hintText={`${mode && mode.toUpperCase()}...`}*/}
				{/*menuProps={{maxHeight:'30%'}}*/}
				{/*onEscKeyDown={this.hide}*/}
				{/*onItemSelected={this.onItemSelected}*/}
				{/*onInputChanged={this.onInputChanged}*/}
				{/*dataSource={this.state.dataSource}*/}
				{/*openOnFocus={true}*/}
				{/*openAlways={true}*/}
				{/*underlineShow={true}/>*/}
			{/*}*/}
			
			
			
			
				
				</Form>
		</DialogRoot>
		</CommandRoot>
	}
	
}

export default IssuePatchDialog