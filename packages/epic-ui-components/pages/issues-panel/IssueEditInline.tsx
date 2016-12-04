/**
 * Created by jglanz on 7/21/16.
 */
// Imports
import { FormEvent } from "react"
import { TextField, Icon, Button, RepoLabel, getGithubErrorText } from "epic-ui-components"
import { List } from "immutable"
import { Issue, Milestone, AvailableRepo, IIssueListItem } from "epic-models"
import filterProps from "react-valid-props"
import { ThemedStyles, makeThemeFontSize, IThemedAttributes } from "epic-styles"
import { connect } from "react-redux"
import { createStructuredSelector } from "reselect"
import { availableReposSelector } from "epic-typedux"
import { CommandComponent, ICommandComponent, CommandRoot, CommandContainerBuilder } from "epic-command-manager-ui"
import { getUIActions, getIssueActions } from "epic-typedux/provider"
import { cloneObjectShallow, cloneObject, shallowEquals, addErrorMessage, guard } from "epic-global"
import { IRowState, MilestoneLabel, WorkIndicator, RepoSelect, Form, FormValidators } from "epic-ui-components/common"
import { getValue, isNumber } from "typeguard"
import { IssuesPanel, IssuesPanelController, getIssuesPanelSelector } from "epic-ui-components/pages/issues-panel"
import {
	FlexAuto,
	makePaddingRem,
	makeStyle,
	FlexScale,
	Ellipsis,
	colorAlpha,
	FlexRowCenter,
	FillWidth,
	OverflowHidden,
	rem,
	FlexColumnCenter,
	FlexColumn,
	makeTransition,
	PositionRelative, makeHeightConstraint
} from "epic-styles/styles"
import { enabledAvailableReposSelector } from "epic-typedux/selectors"


// Constants
const
	log = getLogger(__filename)

//region Styles
const
	actionHeight = rem(3),
	baseStyles = (topStyles, theme, palette) => {
		const
			{ text, accent, primary, background, secondary } = palette
		
		return [
			OverflowHidden,
			FlexColumn,
			FillWidth,
			FlexAuto,
			makeTransition('opacity'),
			
			{
				
				backgroundColor: background,
				
				
				issue: [
					FillWidth,
					PositionRelative,
					makeTransition([ 'background-color' ]), {
						// COLORS
						backgroundColor: background,
						color: text.secondary,
						borderBottom: '0.1rem solid ' + colorAlpha(text.secondary, 0.1),
						
						cursor: 'pointer',
						
						// Issue selected
						selected: [],
						
						// Avatar component
						avatar: [ {} ],
						
						
					}
				],
				
				
				row: [ FlexRowCenter, FillWidth, {
					
					spacer: [ FlexScale ],
					
					action: [ FlexRowCenter, FlexAuto, {
						borderRadius: 0,
						height: actionHeight,
						icon: [ FlexAuto, FlexColumnCenter, makePaddingRem(0.3, 1, 0.3, 0), {
							fontSize: makeThemeFontSize(1.3)
						} ],
						label: [ FlexAuto, FlexColumnCenter ]
					} ]
				} ]
			}
		]
	}
//endregion


/**
 * IIssueEditInlineProps
 */
export interface IIssueEditInlineProps extends IThemedAttributes {
	
	
	editingIssue?: Issue
	
	
	availableRepos?: List<AvailableRepo>
	
	viewController?: IssuesPanelController
	
	rowState?: IRowState<string,string,number>
	items?: List<IIssueListItem<any>>
}

/**
 * IIssueEditInlineState
 */
export interface IIssueEditInlineState {
	textField?: any
	focused?: boolean
	labelField?: any
	
	realIndex?: number
	item?: IIssueListItem<any>
}

/**
 * IssueCreateInline
 *
 * @class IssueEditInline
 * @constructor
 **/


@connect(() => createStructuredSelector({
	editingIssue: getIssuesPanelSelector(selectors => selectors.editingIssueSelector),
	availableRepos: enabledAvailableReposSelector,
	items: getIssuesPanelSelector(selectors => selectors.issueItemsSelector)
}))
@CommandComponent()
@ThemedStyles(baseStyles)
export class IssueEditInline extends React.Component<IIssueEditInlineProps,IIssueEditInlineState> implements ICommandComponent {
	
	refs: any
	
	commandItems = (builder: CommandContainerBuilder) =>
		builder.make()
	
	readonly commandComponentId: string = 'IssueEditInline'
	
	
	/**
	 * Get the form
	 *
	 * @returns {IForm}
	 */
	get form() {
		return this.refs.form as IForm
	}
	
	
	/**
	 * Check for changes to editing issue
	 *
	 * @param nextProps
	 * @param nextState
	 *
	 * @returns {boolean}
	 */
	shouldComponentUpdate = (nextProps, nextState) => {
		return !shallowEquals(this.props, nextProps, 'availableRepos', 'editingIssue', 'styles', 'theme', 'palette') || !shallowEquals(this.state, nextState)
	}
	
	/**
	 * Get issues panel from context
	 *
	 * @returns {IssuesPanel}
	 */
	private get controller() {
		return this.props.viewController
	}
	
	
	/**
	 * Update the internal state
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{ items, rowState } = props,
			realIndex: number = rowState.item,
			item = isNumber(realIndex) && items.get(realIndex)
		
		this.setState({
			item,
			realIndex
		})
	}
	
	/**
	 * On mount update state
	 *
	 * @type {(props?:any)=>any}
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props update state
	 */
	componentWillReceiveProps = this.updateState
	
	
	/**
	 * Internal issue accessor
	 *
	 * @returns {Issue}
	 */
	private get issue(): Issue {
		return this.props.editingIssue
	}
	
	
	/**
	 * Title input changed
	 *
	 */
	onTitleChange = (event: FormEvent<HTMLInputElement>) => {
		this.controller.setEditingIssue(
			cloneObjectShallow(this.issue, {
				title: event.currentTarget.value
			})
		)
	}
	
	/**
	 * Selected repo changed
	 *
	 * @param repo
	 */
	private onRepoItemSelected = (repo) => {
		const
			{ editingIssue } = this.props
		
		if (editingIssue.repoId === repo.id)
			return
		
		this.controller.setEditingIssue(cloneObjectShallow(editingIssue, {
			milestone: null,
			labels: [],
			repoId: repo.id
		}))
	}
	
	/**
	 * Text field ref
	 *
	 * @param textField
	 */
	private setTextField = (textField) => {
		if (textField)
			this.setState({ textField })
	}
	
	/**
	 * Hide the editor field
	 */
	
	hide = () => {
		this.controller.setEditingInline(false)
	}
	
	/**
	 * Save the issue
	 */
	save = async() => {
		await getIssueActions().saveIssue(cloneObject(this.issue))
		this.hide()
	}
	
	/**
	 * When blurred, hide after delay in case another field is selected
	 * in inline form
	 *
	 * @param event
	 *
	 */
	onBlur = (event) => {
		log.debug('Inline edit blurred', document.activeElement)
		
		if (getValue(() => this.form.isWorking())) {
			
		} else {
			guard(() => this.props.onBlur(event))
			//this.hide()
		}
		
		
	}
	
	/**
	 * on focus event
	 *
	 * @param event
	 */
	onFocus = (event) => {
		log.debug('inline edit focused')
		
		guard(() => this.props.onFocus(event))
	}
	
	/**
	 * Watch for the enter key
	 *
	 * @param event
	 * @returns {boolean}
	 */
	private onKeyDown = (event: React.KeyboardEvent<any>) => {
		if (event.keyCode === 13) {
			this.form.submit()
			
			event.preventDefault()
			event.stopPropagation()
			return false
		}
	}
	
	
	/**
	 * on form valid
	 *
	 * @param values
	 */
	private onFormValid = (values: IFormFieldValue[]) => {
		log.debug(`onValid`, values)
	}
	
	/**
	 * On form invalid
	 *
	 * @param values
	 */
	private onFormInvalid = (values: IFormFieldValue[]) => {
		log.debug(`onInvalid`, values)
	}
	
	/**
	 * On submit when the form is valid
	 *
	 * @param form
	 * @param model
	 * @param values
	 */
	private onFormValidSubmit = (form: IForm, model: any, values: IFormFieldValue[]) => {
		return this.save()
	}
	
	
	render() {
		const
			{ issue, props, state } = this,
			{ styles, style, availableRepos } = props,
			
			availRepo = issue && availableRepos && availableRepos.find(it => it.id === issue.repoId),
			repo = availRepo && availRepo.repo
		
		
		if (!issue)
			return <div/>
		
		const
			issueStyles = makeStyle(
				styles.issue,
				styles.issue.selected
			)
		
		
		return <CommandRoot
			{...filterProps(props)}
			component={this}
			style={makeStyle(issueStyles,style)}
			className={'selected'}>
			
			{/*<div style={styles.issueMarkers}></div>*/}
			
			
			<Form
				id="issue-edit-inline-form"
				ref="form"
				onInvalid={this.onFormInvalid}
				onValid={this.onFormValid}
				onValidSubmit={this.onFormValidSubmit}
				styles={styles}
			>
				{/* REPO -> MILESTONE -> ACTIONS */}
				<div style={[styles.row, makePaddingRem(0)]}>
					
					<RepoSelect
						onItemSelected={this.onRepoItemSelected}
						repos={availableRepos}
						repo={availRepo}
						style={makeStyle(FlexScale,makeMarginRem(0.3,2,0,0.5),makeHeightConstraint(actionHeight))}/>
					
					
					{/* MILESTONE */}
					<MilestoneLabel
						style={makeStyle(makePaddingRem(0,1,0,0.7),FlexAuto)}
						milestone={issue.milestone}/>
					
					
					{/* ACTIONS */}
					<Button style={styles.row.action}
					        mode='flat'
					        onClick={this.hide}>
						<Icon style={[styles.row.action.icon,makePaddingRem(0.1)]}
						      iconSet='material-icons'>
							close
						</Icon>
					</Button>
					<Button style={styles.row.action}
					        mode='flat'
					        onClick={this.save}>
						<Icon style={[styles.row.action.icon,makePaddingRem(0.1)]}
						      iconSet='material-icons'>
							save
						</Icon>
					</Button>
				
				</div>
				{/* ISSUE TITLE */}
				<div style={[styles.row,makePaddingRem(0.5,0)]}>
					<TextField
						ref={this.setTextField}
						validators={[FormValidators.makeLengthValidator(1,9999,'Issue title must be provided')]}
						defaultValue={issue.title}
						placeholder="title"
						onChange={this.onTitleChange}
						onBlur={this.onBlur}
						onKeyDown={this.onKeyDown}
						style={FlexScale}
						inputStyle={FlexScale}
						tabIndex={0}
					  autoFocus
					/>
				</div>
			
			</Form>
		
		</CommandRoot>
	}
	
}