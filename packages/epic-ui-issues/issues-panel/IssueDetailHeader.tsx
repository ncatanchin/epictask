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
	IssueStateIcon,
	IssueLabelsAndMilestones, FormButton
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
import {
	canEditIssue, canAssignIssue, getValue, shallowEquals, cloneObjectShallow, unwrapRef,
	guard
} from "epic-global"
import IssuesPanelController from "./IssuesPanelController"
import { IssueActionFactory } from "epic-typedux/actions"
import { makeStyle, colorAlpha, makeIcon } from "epic-styles/styles"
import { CommonKeys, GlobalKeys } from "epic-command-manager"

// Constants
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

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
		
		return [ flexTransition, {
			
			root: [
				flexTransition,
				Styles.FlexAuto,
				Styles.FlexColumn,
				Styles.PositionRelative,
				makePaddingRem(0.5, 0.5, 1, 0.5), {
					
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
					
					
					color: colorAlpha(text.secondary, 0.7),
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
			
			row2: [ flexTransition, Styles.FlexRowCenter, Styles.FlexAuto, Styles.PositionRelative, makePaddingRem(0.7, 0, 1.2, 0.5), {} ],
			
			// Row 3 - Labels + title
			row3: [ flexTransition, Styles.FlexRow, Styles.FlexAuto, makePaddingRem(0,0.5,0,0), {
				milestone: [ Styles.FlexAuto ],
				labels: [ Styles.FlexScale ]
				
				
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
	viewController: IssuesPanelController
	selectedIssue?: Issue
	labels?: List<Label>
	milestones?: List<Milestone>
	assignees?: List<User>,
	saving?: boolean
	saveError?: any
}

/**
 * IIssueDetailHeaderState
 */
export interface IIssueDetailHeaderState {
	editIssue?: Issue
	editFocusField?:string
}


function makeSelector() {
	
	const
		selectedIssueSelector = createSelector(
			(state, props: IIssueDetailHeaderProps) => getValue(() =>
				props.viewController.selectors.selectedIssueSelector(state)),
			(selectedIssue: Issue) => selectedIssue
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
	
	refs: any
	
	issueActions = new IssueActionFactory()
	
	get form(): IForm {
		return this.refs.form
	}
	
	/**
	 * Stop editing the issue
	 *
	 * either called after save/commit or on issue change
	 */
	private stopEditingIssue() {
		this.setState({
			editIssue: null,
			editFocusField: null
		})
	}
	
	/**
	 * Get editing issue
	 */
	private getEditIssue = () => {
		let
			issue: Issue = getValue(() => this.state.editIssue)
		
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
	
	/**
	 * Save the issue
	 */
	private save = async() => {
		
		const
			actions = new IssueActionFactory(),
			updateIssue = this.getEditIssue()
		
		log.debug(`Saving issue`, updateIssue)
		try {
			await actions.saveIssue(updateIssue)
			
			getNotificationCenter().notifyInfo(`#${updateIssue.number} Updated Successfully`)
			this.stopEditingIssue()
		} catch (err) {
			log.error(`failed to save issue`, err)
			
			getNotificationCenter().notifyError(err)
		}
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
	private onEditKeyDown = (event: React.KeyboardEvent<any>) => {
		log.debug(`Edit key down`, event, event.keyCode, event.key, event.charCode)
		
		if (event.key === GlobalKeys[CommonKeys.Escape]) {
			this.onEscape()
		}
		
	}
	
	/**
	 * On escape stop
	 */
	private onEscape = () => {
		this.stopEditingIssue()
	}
	
	/**
	 * Update the milestone
	 *
	 * @param milestone
	 */
	private setEditMilestone = (milestone: Milestone) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				milestone
			})
		})
	}
	
	
	/**
	 * Update the labels
	 *
	 * @param labels
	 */
	private setEditLabels = _.debounce(async(labels: Label[]) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				labels: [ ...labels ]
			})
		})
	}, 50)
	
	
	/**
	 * Update the assignee
	 *
	 * @param assignee
	 */
	private setEditAssignee = (assignee: User) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				assignee
			})
		})
	}
	
	/**
	 * Edit title
	 */
	private startEdit = editFocusField => event => {
		this.setState({
			editIssue: this.getEditIssue(),
			editFocusField
		})
		// , () => setTimeout(() => {
		// 	let
		// 		elem = unwrapRef(this.refs[focusField])
		//
		//
		//
		// 		const
		// 			inputElem = elem && $(elem).find('input')[0]
		//
		// 		log.debug(`Focusing on ${focusField}`,elem,inputElem)
		//
		// 		if (inputElem)
		// 			elem = inputElem
		//
		// 		elem && elem.focus && elem.focus()
		//
		// },250))
	}
	
	/**
	 * Update the labels
	 *
	 * @param title
	 */
	private setEditTitle = (title: string) => {
		this.setState({
			editIssue: cloneObjectShallow(this.getEditIssue(), {
				title
			})
		})
	}
	
	/**
	 * Unassign the issues
	 *
	 * @param issues
	 */
	private unassignIssue = (...issues: Issue[]) =>
		this.form.submit(async() => {
			await this.issueActions.applyPatchToIssues({ assignee: null }, true, List<Issue>(issues))
		})
	
	/**
	 * Callback for label or milestone remove
	 *
	 * @param issue
	 * @param item
	 */
	private removeItem = (issue: Issue, item: Label|Milestone) => {
		this.form.submit(async() => {
			log.debug(`Removing item from issue`, item)
			
			
			if (item.$$clazz === Label.$$clazz) {
				const
					label: Label = item as any,
					labels = [ { action: 'remove', label } ] //issue.labels.filter(it => it.url !== label.url)
				
				await this.issueActions.applyPatchToIssues({ labels }, true, List<Issue>([ issue ]))
			} else {
				await this.issueActions.applyPatchToIssues({ milestone: null }, true, List<Issue>([ issue ]))
			}
		})
	}
	
	private focusProps(field) {
		return getValue(() => this.state.editFocusField) === field ?
			{autoFocus:true} : {}
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
	componentWillReceiveProps(nextProps: IIssueDetailHeaderProps, nextContext: any): void {
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
			{ editIssue } = this.state,
			
			issue = editIssue || selectedIssue
		
		if (!issue)
			return React.DOM.noscript()
		
		const
			
			// EDIT CONTROLS
			controlStyle = {
				backgroundColor: palette.canvasColor,
				color: palette.textColor
			},
			canEdit = canEditIssue(issue.repo, issue),
			
			editableProps = !canEdit ? {} : {
					tabIndex: 0
				},
			
			editLabelsControl = canEdit &&
				
				<div style={[Styles.FlexRowCenter,Styles.CursorPointer]}>
					
					{/* Add a tag/label */}
					<i key={`${issue.id}LabelEditIcon`}
					   onClick={this.startEdit('labels')}
					   style={[styles.row3.labels.add, controlStyle]}
					   className='material-icons'>edit</i>
					
					{/* Add/change milestone */}
					{!issue.milestone && <i key={`${issue.id}MilestoneEditIcon`}
					                        onClick={this.startEdit('milestone')}
					                        style={[styles.row3.labels.add, controlStyle]}
					                        className='octicon octicon-milestone'/>
					}
				</div>
		
		return <Form
			id="issue-detail-header-form"
			ref="form"
			submitOnCmdCtrlEnter={true}
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
				
				{editIssue ?
				
					<div style={[Styles.makeFlexAlign('center','flex-end'),Styles.FlexAuto,Styles.FlexRow]}>
						<FormButton
							onClick={this.onEscape}
							key='cancelButton'
							hoverHighlight='warn'
							icon={makeIcon('material-icons','close')}
						/>
						<FormButton
							onClick={this.save}
							key='saveButton'
							icon={makeIcon('material-icons','save')}
						/>
					</div>
					
					:
					<Avatar
						{...editableProps}
						user={issue.assignee}
						labelPlacement='before'
						onRemove={
				      issue.assignee &&
					    canAssignIssue(issue.repo) &&
					      (() => this.unassignIssue(issue))
				    }
						onClick={canAssignIssue(issue.repo) && this.startEdit('assignee')}
						prefix={issue.assignee ? 'assigned to' : null}
						prefixStyle={issue.assignee && makePaddingRem(0,0.5,0,0)}
						style={styles.row1.assignee}
						labelStyle={styles.username}
						avatarStyle={styles.avatar}/>
				}
			
				
			</div>
			
			{/* ROW 2 */}
			<div style={[
				styles.row2
			]}>
				
				{editIssue ?
					//errorText={getGithubErrorText(saveError,'title')}
					<TextField
						{...this.focusProps('title')}
						ref="title"
						onKeyDown={this.onEditKeyDown}
						value={editIssue.title || ''}
						validators={[FormValidators.makeLengthValidator(1,9999,'Issue title must be provided')]}
						onChange={this.onTitleChange}
						placeholder="TITLE"
						styles={[
	           Styles.FlexScale,
	           makePaddingRem(0),
	           
	           {
	            marginRight: rem(1),
	            input: [
	            	Styles.FlexScale,
	            	styles.input
              ]
	           }
	         ]}
					/> :
					
					<Textfit
						{...editableProps}
						mode='multi'
						onClick={canEditIssue(issue.repo,issue) && this.startEdit('title')}
						style={makeStyle(
		          styles.title,
		          canEditIssue(issue.repo,issue) && styles.title.canEdit
	           )}>
						{issue.title}
					</Textfit>
				}
				
				{/* TIME */}
				{ editIssue ?
					<AssigneeSelect
						{...this.focusProps('assignee')}
						ref="assignee"
						assignee={issue.assignee}
						repoId={issue.repoId}
						tabIndex={0}
						onKeyDown={this.onEditKeyDown}
						style={makeStyle({opacity: 1, width: 'auto'},makePaddingRem(0,0,0,0))}
						labelStyle={makeStyle(makePaddingRem(0,1,0,0))}
						avatarStyle={makeStyle(makePaddingRem(0))}
						onItemSelected={this.setEditAssignee}/>
					:
					<div
						style={[
							styles.time,
							canAssignIssue(issue.repo) && {marginRight:rem(0.5)}
						]}>
						{moment(issue.updated_at).fromNow()}
					</div>
				}
			</div>
			
			{/* ROW 3 // LABELS & MILESTONES */}
			<div style={[styles.row3,saving && {opacity: 0}]}>
				
				{/* EDIT MILESTONE*/}
				{editIssue ? <MilestoneSelect
						{...this.focusProps('milestone')}
						ref="milestone"
						tabIndex={0}
						style={makeStyle({width: 'auto',marginRight: rem(1)})}
						milestone={issue.milestone}
						repoId={issue.repoId}
						onKeyDown={this.onEditKeyDown}
						onItemSelected={this.setEditMilestone}
					/> :
					<IssueLabelsAndMilestones
						{...editableProps}
						showIcon={true}
						onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
						milestones={issue.milestone && [issue.milestone]}
						onMilestoneClick={canEditIssue(issue.repo,issue) && this.startEdit('milestone')}
						labelStyle={styles.row3.label}
						style={styles.row3.milestone}/>
					
				}
				{/*EDIT MODE*/}
				{editIssue ?
					<LabelFieldEditor
						{...this.focusProps('labels')}
						ref="labels"
						style={Styles.FlexScale}
						labels={getValue(() => editIssue.labels,issue.labels)}
						availableLabels={this.props.labels.filter(it => it.repoId === issue.repoId).toArray()}
						onLabelsChanged={this.setEditLabels}
						onKeyDown={this.onEditKeyDown}
						onEscape={this.onEscape}
						tabIndex={0}
						id="issueDetailsLabelEditor"
						hint="Labels"
					/> :
					
					
					/*VIEW MODE*/
					<IssueLabelsAndMilestones
						{...editableProps}
						labels={issue.labels}
						showIcon={true}
						onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
						labelStyle={styles.row3.label}
						afterAllNode={editLabelsControl}
						style={styles.row3.labels}/>
					
					
				}
			</div>
			
			
		
		</Form>
	}
	
	/*
	 {saving && <div style={[{top:0,left:0,right:0,bottom:0},PositionAbsolute,FlexColumnCenter,Fill]}>
	 
	 <WorkIn
	 color={theme.progressIndicatorColor}
	 size={30}/>
	 </div>}
	 */
	
	
}