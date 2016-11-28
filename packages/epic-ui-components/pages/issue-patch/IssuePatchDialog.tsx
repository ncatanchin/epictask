/**
 * Created by jglanz on 7/24/16.
 */
// Imports

import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { List } from "immutable"
import { MenuItem } from "material-ui"
import { PureRender, LabelChip, Avatar, IssueLabelsAndMilestones } from "../../common"
import { DialogRoot, createSaveCancelActions } from "../../layout/dialog"
import { TypeAheadSelect } from "epic-ui-components/fields"
import { createDeepEqualSelector, getValue } from "epic-global"
import { ThemedStyles, IThemedAttributes } from "epic-styles"
import { Issue, User, Label, Milestone } from "epic-models"
import {
	enabledRepoIdsSelector,
	enabledAssigneesSelector,
	enabledLabelsSelector,
	enabledMilestonesSelector,

	getUIActions
} from "epic-typedux"
import { CommonKeys, CommandType, ContainerNames } from "epic-command-manager"
import { IssueMultiInlineList } from "epic-ui-components/pages/issues-panel/IssueMultiInlineList"
import { IssuePatchModes } from "epic-ui-components/pages/issues-panel/IssuesPanelState"
import { getIssueActions } from "epic-typedux/provider"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"
import IssuePatchController from "epic-ui-components/pages/issue-patch/IssuePatchController"
import { IssuePatchState } from "epic-ui-components/pages/issue-patch/IssuePatchState"
import { labelsSelector, assigneesSelector, milestonesSelector } from "epic-typedux/selectors"
import { CommandContainerBuilder, CommandComponent, CommandRoot } from "epic-command-manager-ui"


// Constants
const
	log = getLogger(__filename),
	tinycolor = require('tinycolor2')

//log.setOverrideLevel(LogLevel.DEBUG)

/**
 * Add global themed styles
 */
// const styleSheet = CreateGlobalThemedStyles((theme, Style) => {
// 	const
// 		{ secondary, accent } = theme.palette,
// 		focusBgColor = tinycolor(accent.hue3).setAlpha(0.2).toRgbString(),
// 		focusColor = accent.hue1,
// 		focusBorderColor = tinycolor(accent.hue1).setAlpha(1).toRgbString(),
// 		hoverColor = secondary.hue1,
// 		pulseAnimation = Style.registerKeyframes({
// 			"0%": {
// 				transform: "translate(0,-50%) scale(0)",
// 				opacity: "0.0"
// 			},
// 			'25%': {
// 				transform: 'translate(0,-50%) scale(0.25)',
// 				opacity: 0.3,
// 			},
// 			'50%': {
// 				transform: "translate(0,-50%) scale(0.6)",
// 				opacity: 0.5
// 			},
// 			'65%': {
// 				transform: 'translate(0,-50%) scale(1)',
// 				opacity: 0.7
// 			},
// 			'85%': {
// 				transform: 'translate(0,-50%) scale(0.8)',
// 				opacity: 0.3
// 			},
// 			'100%': {
// 				transform: 'translate(0,-50%) scale(0.5)',
// 				opacity: 0.0,
// 			}
// 		})
//
//
// 	return createStyles({
// 		'.patchMenuItem:after,.patchMenuItem:before': [ makeTransition([ 'opacity', 'box-shadow', 'color' ]), {
// 			opacity: 0
// 		} ],
// 		'.patchMenuItem:after': {
// 			zIndex: 10,
// 			content: '\' \'',
// 			position: 'absolute',
// 			top: 0,
// 			left: 0,
// 			right: 0,
// 			bottom: 0
// 		},
// 		'.patchMenuItem:before': {
// 			zIndex: 12,
// 			content: `'${String.fromCodePoint(parseInt('f111'/*'f192'*/, 16))}'`,// '\'\\2022\''
// 			fontFamily: 'FontAwesome',
// 			position: 'absolute',
// 			fontSize: rem(1.3),
// 			right: rem(0.5),
// 			lineHeight: rem(2),
// 			top: '50%',
// 			transform: 'translate(0,-50%)',
// 			width: 'auto'
//
// 		},
// 		// Hover or focus - make opaque
// 		'div[data-hover=true] .patchMenuItem:before,  div[data-hover=true] .patchMenuItem:after, div[data-keyboard-focused=true] .patchMenuItem:before, div[data-keyboard-focused=true] .patchMenuItem:after': {
// 			opacity: 1
// 		},
//
// 		// Hover states
// 		'div[data-hover=true]:not([data-keyboard-focus=true]) .patchMenuItem:before': {
// 			color: hoverColor,
// 			animation: `${pulseAnimation} 1.2s ease-out`,
// 			animationIterationCount: 'infinite'
// 		},
//
// 		'div[data-hover=true]:not([data-keyboard-focus=true]) .patchMenuItem:after': {
// 			boxShadow: `inset 0rem 0rem 0.2rem 0.2rem ${hoverColor} !important`
// 		},
//
// 		// Focus states
// 		'div[data-keyboard-focused=true] .patchMenuItem:before': {
// 			color: focusColor,
// 			animation: `${pulseAnimation} 1.2s ease-out`,
// 			animationIterationCount: 'infinite'
// 		},
// 		'div[data-keyboard-focused=true] .patchMenuItem:after': {
// 			boxShadow: `inset 0rem 0rem 0.2rem 0.2rem ${focusBorderColor} !important`
//
// 		}
//
// 	})
// })

// ADD HMR CLEANER
//addHotDisposeHandler(module, styleSheet.clean)


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
	newItems?:any
	query?:string
	dataSource?:any
	typeAheadRef?:any
}

/**
 * IssuePatchDialog
 *
 * @class IssuePatchDialog
 * @constructor
 **/

@ViewRoot(IssuePatchController,IssuePatchState)
@connect(createStructuredSelector({
	availableAssignees: assigneesSelector,
	availableLabels: labelsSelector,
	availableMilestones: milestonesSelector,
	
	// issues: patchIssuesSelector,
	// mode: patchModeSelector,
	// saving: (state) => issueStateSelector(state).issueSaving,
	// saveError: (state) => issueStateSelector(state).issueSaveError,

}))
@CommandComponent()
// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles, 'issuePatchDialog')
@PureRender
export class IssuePatchDialog extends React.Component<IIssuePatchDialogProps,IIssuePatchDialogState> {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder
			.command(CommandType.Container,
				'Save Comment',
				(cmd, event) => this.onSave(event),
				"CommandOrControl+Enter")
			.command(CommandType.Container,
				'Close Dialog',
				this.hide,
				"Escape")
			
			.make()
	
	commandComponentId = ContainerNames.IssuePatchDialog
	
	private get viewState():IssuePatchState {
		return getValue(() => this.props.viewState)
	}
	
	private get viewController() {
		return getValue(() => this.props.viewController)
	}
	
	get mode():TIssuePatchMode {
		return getValue(() => this.viewState.mode)
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
		
		const
			patch = IssuePatchFns[ this.mode ](getValue(() => this.state.newItems, []))
		
		log.info('Applying patch to issue', patch)
		
		await getIssueActions().applyPatchToIssues(
			patch,
			this.mode !== 'Label',
			this.issues
		)
		
		getUIActions().closeWindow()
	}
	
	
	/**
	 * On item selected, if the patch mode is NOT Label
	 * then this will call save
	 *
	 * @param value - MenuItem DataSource element
	 * @param index - DataSource Index
	 */
	onItemSelected = (value, index) => {
		const
			{ mode } = this,
			item = (value && value.item) || _.get(this, `state.dataSource[${index}].item`)
		
		log.info(`Item selected @ index ${index}`, item)
		
		this.setState(
			{ newItems: (mode === IssuePatchModes.Label) ? _.uniq(this.newItems.concat([ item ])) : [ item ] },
			
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
	onNewItemRemove = (item) => {
		log.info(`New item removed: `, item)
		
		this.setState({ newItems: this.newItems.filter(it => it !== item) })
	}
	
	/**
	 * Make milestones datasource
	 *
	 * @param props
	 * @param repoIds
	 * @returns {{item: Milestone, text: string, value: any}[]}
	 */
	makeMilestoneDataSource(props:IIssuePatchDialogProps, repoIds) {
		
		const
			{ availableMilestones } = props,
			{ query, newItems,issues } = this,
			items = availableMilestones
			
			// Filter out repos that don't apply to these issues
				.filter((item:Milestone) => (
					// In current repo and not selected
					repoIds.includes(item.repoId) && !newItems.includes(item) &&
					
					// Query match
					(_.isEmpty(query) || _.toLower(item.title).indexOf(_.toLower(query)) > -1) &&
					
					// Label does not already exist on every item
					!issues.every((issue:Issue) => _.get(issue, 'milestone.id') === item.id)
				))
				
				// Convert to JS Array
				.toArray()
		
		const newDataSource = items.map(item => ({
			item,
			text: '',
			value: <MenuItem manualFocusEnabled={false} primaryText={
						<LabelChip label={item}
								   showRemove={false}
								   showIcon={true}
					    />
					}/>
		}))
		
		log.info('new milestone data source =', newDataSource)
		return newDataSource
	}
	
	/**
	 * Create labels datasource
	 *
	 * @param props
	 * @param repoIds
	 * @returns {{item: Label, text: string, value: any}[]}
	 */
	makeLabelDataSource(props:IIssuePatchDialogProps, repoIds) {
		
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
				.toArray(),
			
			newDataSource = items.map(item => ({
				item,
				text: '',
				value: <MenuItem style={{padding:0}}
				                 className='patchMenuItem'
				                 manualFocusEnabled={false}
				                 innerDivStyle={{padding:0,paddingRight:0,paddingLeft:0}}
				                 primaryText={
	
		                    <LabelChip label={item}
									   labelStyle={makeStyle(makeMarginRem(0,0,0,0),{
									    borderRadius: 0,
									    padding:'1rem 1rem'
									   })}
									   showRemove={false}
									   showIcon={true}
						    />
						}/>
			}))
		
		log.info('new label data source =', newDataSource)
		return newDataSource
	}
	
	
	/**
	 * Crate assignee data source for issues
	 *
	 * @param props
	 * @param repoIds
	 * @returns {any}
	 */
	makeAssigneeDataSource(props:IIssuePatchDialogProps, repoIds) {
		
		
			
		
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
				
				// Filter out repos that don't apply to these issues
				.filter((item:User) => !issues.every((issue:Issue) => _.get(issue, 'assignee.id') === item.id))
		
		log.info(`Assignee data source`, items, 'from', collaborators, 'for issues', issues)
		
		/*
		 style={s.form.assignee.avatar}
		 avatarStyle={s.form.assignee.avatar.avatar}
		 labelStyle={s.form.assignee.avatar.label}
		 */
		const makeCollabLabel = (collab:User) => (
			<Avatar user={collab}
			        labelPlacement='after'
			        labelTextFn={(user:User) =>
			            <span>assign to&nbsp;&nbsp;<span style={{
			            	fontWeight: 700,
			            	color:this.props.theme.palette.accent.hue1
			            }}>{user.name || user.login}</span></span>}
			        labelStyle={makeStyle(FlexScale,{fontSize:rem(1.3)})}
			        avatarStyle={{width:rem(4),height:rem(4),borderRadius: '50%'}}
			/>
		
		)
		
		return items.map(item => ({
			item,
			text: '',
			//style={s.menuItem}
			value: <MenuItem key={item.id}
			                 value={item.id}
			
			                 primaryText={makeCollabLabel(item)}
			/>
		}))
		
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
		
		if (!viewState || !viewState.mode || !viewState.issues.size)
			return
		
		const
			
			{mode,issues} = viewState,
			
			// Get the repo ids for the selected issues only
			repoIds = _.nilFilter(_.uniq(issues.map(issue => issue.repoId).toArray()))
		
		log.debug(`Making datasource for mode`,mode,`repoIds`,repoIds)
		
		const
			
			// Now get the datasource
			dataSource = (mode === 'Milestone') ?
				this.makeMilestoneDataSource(props, repoIds) : (mode === 'Label') ?
				this.makeLabelDataSource(props, repoIds) :
				this.makeAssigneeDataSource(props, repoIds)
		
		this.setState({ dataSource })
		
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
		if (this.props.open !== newProps.open) {
			this.setState({
				query: "",
				newItems: []
			})
		}
		
		this.updateState(newProps)
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
				palette,
				saveError
			} = this.props,
			newItems = this.newItems,
			
			title = mode === IssuePatchModes.Label ? 'Add Label' :
				mode === IssuePatchModes.Assignee ? 'Assign Issues' :
					'Set Milestone',
			
			titleNode = <div style={makeStyle(styles.titleBar.label)}>
				{title}
			</div>,
			titleActionNodes = createSaveCancelActions(theme, palette, this.onSave, this.hide)
			
		
		return <CommandRoot
			id={ContainerNames.IssuePatchDialog}
			component={this}
			style={makeStyle(Fill)}>
			<DialogRoot
			titleNode={titleNode}
			titleActionNodes={titleActionNodes}
			saving={saving}
			style={styles}>
			<div style={styles.root}>
			
			<IssueLabelsAndMilestones
				style={makeStyle(styles.labelsAndMilestones)}
				labels={mode === IssuePatchModes.Label && newItems}
				milestones={mode === IssuePatchModes.Milestone && newItems}
				showIcon={true}
				onRemove={this.onNewItemRemove}
				labelStyle={{}}
			
			/>
			
			{this.state.dataSource &&
			<TypeAheadSelect
				ref={this.setTypeAheadRef}
				style={styles.input}
				autoFocus={true}
				fullWidth={true}
				hintText={`${mode && mode.toUpperCase()}...`}
				menuProps={{maxHeight:'30%'}}
				onEscKeyDown={this.hide}
				onItemSelected={this.onItemSelected}
				onInputChanged={this.onInputChanged}
				dataSource={this.state.dataSource}
				openOnFocus={true}
				openAlways={true}
				underlineShow={true}/>
			}
			
			<div style={styles.issues}>
				<IssueMultiInlineList issues={List<Issue>(issues)} style={styles.issues.list}/>
			</div>
			
			
				
				</div>
		</DialogRoot>
		</CommandRoot>
	}
	
}

export default IssuePatchDialog