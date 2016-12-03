// Imports
import { List } from "immutable"
import { CircularProgress } from "material-ui"
import { connect } from "react-redux"
import { createSelector, createStructuredSelector } from "reselect"
import {
	LabelFieldEditor,
	MilestoneSelect,
	AssigneeSelect,
	Form,
	FormValidators,
	chipStyles,
	TextField,
	PureRender,
	RepoLabel,
	Avatar,
	makeComponentStyles,
	IssueStateIcon,
	IssueLabelsAndMilestones
} from "epic-ui-components/common"

import {
	IThemedAttributes,
	ThemedStyles,
	FlexRowCenter,
	FlexAuto,
	makeTransition,
	makeMarginRem,
	FlexScale,
	PositionRelative,
	makePaddingRem,
	FlexColumn
} from "epic-styles"
import { enabledLabelsSelector, enabledAssigneesSelector, enabledMilestonesSelector } from "epic-typedux/selectors"
import { Issue, Milestone, Label, User } from "epic-models"
import { canEditIssue, canAssignIssue, getValue, shallowEquals, cloneObjectShallow } from "epic-global"
import IssuesPanelController from "epic-ui-components/pages/issues-panel/IssuesPanelController"
import { IssueActionFactory } from "epic-typedux/actions"
import { makeStyle, colorAlpha } from "epic-styles/styles"

// Constants
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)

// DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

const
	baseStyles = (topStyles, theme, palette) => {
		
		
		const
			labelBaseStyles = createStyles(chipStyles, null, theme, palette),
			{ background, primary, accent, text, secondary } = palette,
			flexTransition = makeTransition([
				'opacity',
				'width',
				'height',
				'margin-right',
				'margin-left',
				'margin-bottom',
				'margin-top',
				'padding-bottom',
				'padding-top',
				'padding-right',
				'padding-left' ])
		
		return [ flexTransition, makeComponentStyles(theme, palette), {
			
			root: [
				flexTransition,
				FlexAuto,
				FlexColumn,
				PositionRelative,
				makePaddingRem(0.5,0.5,1,0.5),{
					
					backgroundColor: TinyColor(primary.hue1).setAlpha(0.7).toRgbString(),
					color: text.primary
				} ],
			
			hidden: [ makePaddingRem(0), makeMarginRem(0), makeFlex(0, 0, 0), {
				border: 0,
				opacity: 0,
				height: 0,
				width: 0,
				pointerEvents: 'none'
			} ],
			
			row1: [ flexTransition, FlexRowCenter, FlexAuto, {
				
				state: [ {
					root: [ {
						marginRight: rem(0.25)
					} ]
				} ],
				
				// REPO
				repo: [ FlexScale, makePaddingRem(0.5, 0), {
					fontSize: themeFontSize(1.4),
					fontWeight: 500,
					
					
					color: colorAlpha(text.secondary,0.7),
					[CSSHoverState]: {
						color: secondary.hue1
					}
				} ],
				
				// ASSIGNEE
				assignee: [ OverflowHidden, makeMarginRem(0, 0, 0, 1), {
					opacity: 1,
					height: 'auto'
				} ]
			} ],
			
			row2: [ flexTransition, FlexRowCenter, FlexAuto, PositionRelative, makePaddingRem(0, 0, 1, 0), {} ],
			
			// Row 3 - Labels + title
			row3: [ flexTransition, FlexRow, FlexAuto, {
				milestone: [ FlexAuto],
				labels: [ FlexScale]
				
				
				
			} ],
			
			title: [ OverflowHidden, PositionRelative, FlexScale, {
				fontSize: themeFontSize(2),
				textOverflow: 'clip ellipsis',
				lineHeight: '2.2rem',
				maxHeight: '4.4rem',
				maxWidth: '100%',
				
				canEdit: [ {
					cursor: 'pointer'
				} ]
			} ],
			
		} ]
	}

/**
 * IIssueDetailHeaderProps
 */
export interface IIssueDetailHeaderProps extends IThemedAttributes {
	viewController:IssuesPanelController
	selectedIssue?:Issue
	labels?:List<Label>
	milestones?:List<Milestone>
	assignees?:List<User>,
	saving?:boolean
	saveError?:any
}

/**
 * IIssueDetailHeaderState
 */
export interface IIssueDetailHeaderState {
	editIssue?:Issue
	editMilestone?:boolean
	editAssignee?:boolean
	editLabels?:boolean
	editTitle?:boolean
}


function makeSelector() {
	
	const
		selectedIssueSelector = createSelector(
			(state, props:IIssueDetailHeaderProps) => getValue(() =>
				props.viewController.selectors.selectedIssueSelector(state)),
			(selectedIssue:Issue) => selectedIssue
		)
	
	return createStructuredSelector({
		selectedIssue: selectedIssueSelector,
		labels: enabledLabelsSelector,
		assignees: enabledAssigneesSelector,
		milestones: enabledMilestonesSelector
	})
}

/**
 * IssueDetailHeader
 *
 * @class IssueDetailHeader
 * @constructor
 **/

@connect(makeSelector)
@ThemedStyles(baseStyles)
@PureRender
export class IssueDetailHeader extends React.Component<IIssueDetailHeaderProps,IIssueDetailHeaderState> {
	
	issueActions = new IssueActionFactory()
	
	/**
	 * Stop editing the issue
	 *
	 * either called after save/commit or on issue change
	 */
	private stopEditingIssue() {
		this.setState({
			editIssue: null,
			editLabels: false,
			editMilestone: false,
			editAssignee: false,
			editTitle: false
		})
	}
	
	/**
	 * Get editing issue
	 */
	private getEditIssue = () => {
		let
			issue:Issue = getValue(() => this.state.editIssue)
		
		if (!issue) {
			issue = getValue(() =>
				this.props.selectedIssue)
			
			assert(issue, `Issue should never be null here`)
			
			issue = cloneObjectShallow(issue)
		}
		
		return issue
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
	private onFormValidSubmit = async (form:IForm,model:any,values:IFormFieldValue[]) => {
		
	}
	
	/**
	 * Save the issue
	 */
	private save = async() => {
		
		const
			actions = new IssueActionFactory(),
			updateIssue = this.getEditIssue()
		
		log.info(`Saving issue`, updateIssue)
		
		await actions.saveIssue(updateIssue)
		
		this.stopEditingIssue()
	}
	
	/**
	 * On enter key
	 *
	 * @param event
	 */
	private editSave = this.save
	
	/**
	 * On Key down event in edit field
	 *
	 * @param event
	 */
	private onEditKeyDown = (event:React.KeyboardEvent<any>) => {
		log.debug(`Edit key down`, event, event.keyCode, event.key, event.charCode)
		
		if ((Env.isMac ? event.metaKey : event.ctrlKey) && event.key === 'Enter') {
			this.editSave()
			event.stopPropagation()
		}
	}
	
	/**
	 * On escape stop
	 */
	onEscape = () => {
		this.stopEditingIssue()
	}
	
	/**
	 * Edit the milestones
	 */
	private editMilestone = () => {
		this.setState({
			editMilestone: true,
			editLabels: true,
			editIssue: this.getEditIssue()
		})
	}
	/**
	 * Update the milestone
	 *
	 * @param milestone
	 */
	private setEditMilestone = (milestone:Milestone) => {
		this.setState({
			editIssue: assign({}, this.getEditIssue(), {
				milestone
			})
		}, () => this.editSave())
	}
	
	/**
	 * Edit label
	 */
	private editLabels = () => {
		this.setState({
			editMilestone: true,
			editLabels: true,
			editIssue: this.getEditIssue()
		})
	}
	
	/**
	 * Update the labels
	 *
	 * @param labels
	 */
	private setEditLabels = _.debounce(async(labels:Label[]) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				labels: [ ...labels ]
			})
		}, () => this.editSave())
	}, 50)
	
	/**
	 * Assign the issue
	 */
	private editAssignee = () => {
		this.setState({
			editAssignee: true,
			editIssue: this.getEditIssue()
		})
	}
	
	/**
	 * Update the assignee
	 *
	 * @param assignee
	 */
	private setEditAssignee = (assignee:User) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				assignee
			})
		}, () => this.editSave())
	}
	
	/**
	 * Edit title
	 */
	private editTitle = () => {
		this.setState({
			editTitle: true,
			editIssue: this.getEditIssue()
		})
	}
	
	/**
	 * Update the labels
	 *
	 * @param title
	 */
	private setEditTitle = (title:string) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				title
			})
		})
	}
	
	// Container.get(IssueActionFactory)
	// 	.patchIssues("Assignee", ...issues)
	//
	
	/**
	 * Unassign the issues
	 *
	 * @param issues
	 */
	private unassignIssue = (...issues:Issue[]) =>
		this.issueActions.applyPatchToIssues({ assignee: null }, true, List<Issue>(issues))
	
	/**
	 * Callback for label or milestone remove
	 *
	 * @param issue
	 * @param item
	 */
	private removeItem = (issue:Issue, item:Label|Milestone) => {
		
		log.debug(`Removing item from issue`, item)
		
		if (item.$$clazz === Label.$$clazz) {
			const
				label:Label = item as any,
				labels = [ { action: 'remove', label } ] //issue.labels.filter(it => it.url !== label.url)
			
			this.issueActions.applyPatchToIssues({ labels }, true, List<Issue>([ issue ]))
		} else {
			this.issueActions.applyPatchToIssues({ milestone: null }, true, List<Issue>([ issue ]))
		}
	}
	
	/**
	 * On title change set it on the state
	 *
	 * @param event
	 */
	private onTitleChange = (event) => this.setEditTitle((event.target as any).value)
	
	/**
	 * When we get new props - check to see if the issue changed
	 *
	 * - if changed, then stop editing
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:IIssueDetailHeaderProps, nextContext:any):void {
		if (!shallowEquals(this.props, nextProps, 'selectedIssue')) {
			this.stopEditingIssue()
		}
	}
	
	/**
	 * Render the header
	 */
	render() {
		const
			{ theme, palette, styles, selectedIssue, saving, saveError } = this.props,
			{ editLabels, editMilestone, editTitle, editAssignee, editIssue } = this.state,
			
			issue = editIssue || selectedIssue,
			
			// EDIT CONTROLS
			controlStyle = {
				backgroundColor: palette.canvasColor,
				color: palette.textColor
			},
			canEdit = canEditIssue(issue.repo, issue),
			editLabelsControl = canEdit &&
				<div style={FlexRowCenter}>
					
					{/* Add a tag/label */}
					<i key={`${issue.id}LabelEditIcon`}
					   onClick={() => this.editLabels()}
					   style={[styles.row3.labels.add, controlStyle]}
					   className='material-icons'>edit</i>
					
					{/* Add/change milestone */}
					{!issue.milestone && <i key={`${issue.id}MilestoneEditIcon`}
					                        onClick={() => this.editMilestone()}
					                        style={[styles.row3.labels.add, controlStyle]}
					                        className='octicon octicon-milestone'/>
					}
				</div>
		
		return <Form
			id="issue-detail-header-form"
			onInvalid={this.onFormInvalid}
			onValid={this.onFormValid}
			onValidSubmit={this.onFormValidSubmit}
			styles={[styles.root]}>
			
			{/* ROW 1 */}
			<div style={[styles.row1,saving && {opacity: 0}]}>
				
				{/* STATE ICON - CAN TOGGLE ON/OFF */}
				<IssueStateIcon styles={[styles.row1.state]}
				                showToggle={canEdit}
				                issue={issue}/>
				
				<div style={[styles.row1.repo]}>
					<RepoLabel repo={issue.repo}/>
				</div>
				
				{/* ASSIGNEE */}
				
				<AssigneeSelect
					assignee={issue.assignee}
					repoId={issue.repoId}
					onKeyDown={this.onEditKeyDown}
					style={makeStyle({opacity: 1, width: 'auto'},makePaddingRem(0,0,0,0),!editAssignee && styles.hidden)}
					labelStyle={makeStyle(makePaddingRem(0,1,0,0))}
					avatarStyle={makeStyle(makePaddingRem(0))}
					onItemSelected={this.setEditAssignee}/>
				
				<Avatar
					user={issue.assignee}
					labelPlacement='before'
					onRemove={
			      issue.assignee &&
				    canAssignIssue(issue.repo) &&
				      (() => this.unassignIssue(issue))
			    }
					onClick={canAssignIssue(issue.repo) && (() => this.editAssignee())}
					prefix={issue.assignee ? 'assigned to' : null}
					prefixStyle={issue.assignee && makePaddingRem(0,0.5,0,0)}
					style={makeStyle(styles.row1.assignee,editAssignee && styles.hidden)}
					labelStyle={styles.username}
					avatarStyle={styles.avatar}/>
			
			
			</div>
			
			{/* ROW 2 */}
			<div style={[styles.row2,saving && {opacity: 0}]}>
				
				{editTitle &&
				//errorText={getGithubErrorText(saveError,'title')}
				<TextField value={editIssue.title || ''}
				           validators={[FormValidators.makeLengthValidator(1,9999,'Issue title must be provided')]}
				           onChange={this.onTitleChange}
				           onKeyDown={this.onEditKeyDown}
				           errorStyle={{transform: 'translate(0,1rem)'}}
				           placeholder="TITLE"
				           styles={[
				           	 FlexScale,
				           	 makePaddingRem(0),
				           	 !editTitle && styles.hidden,
				           	 
				           	 {
				           	 	marginRight: rem(1),
				           	 	input: [FlexScale,styles.input]
				           	 }
			             ]}
				           
				
				
				/>
				}
				<Textfit mode='multi'
				         onClick={canEditIssue(issue.repo,issue) && this.editTitle}
				         style={makeStyle(
					         	styles.title,
					         	canEditIssue(issue.repo,issue) && styles.title.canEdit,
					          editTitle && styles.hidden
				           )}>
					{issue.title}
				</Textfit>
				
				{/* TIME */}
				<div
					style={[styles.time,canAssignIssue(issue.repo) && {marginRight:rem(0.5)}]}>{moment(issue.updated_at).fromNow()}</div>
			
			</div>
			
			{/* ROW 3 // LABELS & MILESTONES */}
			<div style={[styles.row3,saving && {opacity: 0}]}>
				
				{/* EDIT MILESTONE*/}
				{editMilestone ? <MilestoneSelect
					style={makeStyle({width: 'auto',marginRight: rem(1)},!editLabels && styles.hidden)}
					milestone={issue.milestone}
					repoId={issue.repoId}
					underlineShow={false}
					onKeyDown={this.onEditKeyDown}
					onItemSelected={this.setEditMilestone}
				/> :
					<IssueLabelsAndMilestones showIcon={true}
					                          onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
					                          milestones={issue.milestone && [issue.milestone]}
					                          onMilestoneClick={canEditIssue(issue.repo,issue) && (() => this.editMilestone())}
					                          labelStyle={styles.row3.label}
					                          style={makeStyle(styles.row3.milestone,editLabels && styles.hidden)}/>
					
				}
				{/*EDIT MODE*/}
				{editLabels ?
					<LabelFieldEditor
						style={makeStyle(FlexScale,!editLabels && styles.hidden)}
						labels={getValue(() => editIssue.labels,issue.labels)}
						availableLabels={this.props.labels.filter(it => it.repoId === issue.repoId).toArray()}
						onLabelsChanged={this.setEditLabels}
						onKeyDown={this.onEditKeyDown}
						onEscape={this.onEscape}
						autoFocus={true}
						tabIndex={-1}
						id="issueDetailsLabelEditor"
						hint="Labels"
					/> :
					
					
					/*VIEW MODE*/
					<IssueLabelsAndMilestones labels={issue.labels}
					                          showIcon={true}
					                          onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
					                          labelStyle={styles.row3.label}
					                          afterAllNode={editLabelsControl}
					                          style={makeStyle(styles.row3.labels,editLabels && styles.hidden)}/>
					
				}
			</div>
			
			{saving && <div style={[{top:0,left:0,right:0,bottom:0},PositionAbsolute,FlexColumnCenter,Fill]}>
				
				<CircularProgress
					color={theme.progressIndicatorColor}
					size={30}/>
			</div>}
		</Form>
	}
	
	
}