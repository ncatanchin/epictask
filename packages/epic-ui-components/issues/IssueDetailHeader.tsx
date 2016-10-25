// Imports
import * as React from "react"
import { List } from "immutable"
import { TextField, CircularProgress } from "material-ui"
import { connect } from "react-redux"
import {
	PureRender,
	RepoName,
	getGithubErrorText,
	Avatar,
	LabelFieldEditor,
	makeComponentStyles,
	IssueLabelsAndMilestones,
	baseStyles as labelBaseStylesFn,
	MilestoneSelect,
	AssigneeSelect,
	IssueStateIcon
} from "epic-ui-components"
import { createStructuredSelector } from "reselect"
import {
	IThemedAttributes,
	ThemedStyles,
	FlexRowCenter,
	FlexAuto,
	makeTransition,
	makeMarginRem,
	FlexScale,
	FlexAlignStart,
	PositionRelative,
	makePaddingRem,
	FlexColumn
} from "epic-styles"
import {
	selectedIssueSelector,
	issueSaveErrorSelector,
	issueSavingSelector,
	enabledLabelsSelector,
	enabledAssigneesSelector,
	enabledMilestonesSelector,
	getIssueActions
} from "epic-typedux"
import { Issue, Milestone, Label, User } from "epic-models"
import { canEditIssue, canAssignIssue, getValue, cloneObject, shallowEquals } from "epic-global"

// Constants
const
	{ Textfit } = require('react-textfit'),
	log = getLogger(__filename)

// DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

const
	baseStyles = (topStyles,theme,palette) => {
			
		
		const
			labelBaseStyles = createStyles(labelBaseStylesFn,null,theme,palette),
			{background,primary,accent,text,secondary} = palette,
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
				'padding-left'])
		
		return [flexTransition,makeComponentStyles(theme,palette),{
				
			root: [flexTransition, FlexAuto, FlexColumn,PositionRelative, {
				padding: "1rem",
				backgroundColor: TinyColor(primary.hue1).setAlpha(0.7).toRgbString(),
				color: text.primary
			}],
			
			hidden: [makeBorderRem(0),makePaddingRem(0),makeMarginRem(0),makeFlex(0,0,0),{
				opacity: 0,
				height: 0,
				width: 0,
				pointerEvents: 'none'
			}],
			
			row1: [ flexTransition,FlexRowCenter, FlexAuto, {
				
				state: [{
					root:[{
						marginRight: rem(1)
					}]
				}],
				
				// REPO
				repo: [ FlexScale, makePaddingRem(0.5,0), {
					fontSize: themeFontSize(1.4),
					fontWeight: 500,
					fontSmooth: 'always',
					WebkitFontSmoothing: 'antialiased',
					
					color: TinyColor(text.secondary).setAlpha(0.7).toRgbString(),
					[CSSHoverState]: {
						color: secondary.hue1
					}
				} ],
				
				// ASSIGNEE
				assignee: [ OverflowHidden,makeMarginRem(0, 0, 0, 1), {
					opacity: 1,
					height: 'auto'
				} ]
			} ],
			
			row2: [ flexTransition,FlexRowCenter, FlexAuto, PositionRelative,makePaddingRem(0.5,0,1,0), {
				
				
				
				
			} ],
			
			// Row 3 - Labels + title
			row3: [ flexTransition, FlexRowCenter, FlexAuto, {
				label: {
					marginTop: rem(0.5)
				},
				milestone: [FlexAuto,FlexAlignStart,{
					
				}],
				labels: [ FlexScale, FlexAlignStart, {
					flexWrap: 'wrap',
					
					add: [
						labelBaseStyles.label,
						FlexRowCenter,
						FlexAuto,
						makeTransition([ 'transform', 'font-size', 'font-weight', 'opacity' ]),
						makeMarginRem(0.5, 0.5, 0, 0),
						makePaddingRem(0),
						{
							//margin: makeMarginRem(0.5,0.5,0,0),//"0.5rem 0.5rem 0 0",
							height: rem(2.4),
							width: rem(2.4),
							position: 'relative',
							fontSize: rem(1.2),
							opacity: 0.5,
							fontWeight: 900,
							cursor: 'pointer',
							
							':hover': {
								opacity: 1,
								transform: 'scale(1.1)'
							}
							
						}
					]
				} ],
				
				
			} ],
			
			title: [ OverflowHidden, PositionRelative, FlexScale, {
				fontSize: themeFontSize(2),
				textOverflow: 'clip ellipsis',
				lineHeight: '2.2rem',
				maxHeight: '4.4rem',
				maxWidth: '100%',
				
				canEdit: [{
					cursor: 'pointer'
				}]
			} ],
			
		}]
	}

/**
 * IIssueDetailHeaderProps
 */
export interface IIssueDetailHeaderProps extends IThemedAttributes {
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

/**
 * IssueDetailHeader
 *
 * @class IssueDetailHeader
 * @constructor
 **/

@connect(createStructuredSelector({
	selectedIssue: selectedIssueSelector,
	labels: enabledLabelsSelector,
	assignees: enabledAssigneesSelector,
	milestones: enabledMilestonesSelector,
	saving: issueSavingSelector,
	saveError: issueSaveErrorSelector
}))
@ThemedStyles(baseStyles)
@PureRender
export class IssueDetailHeader extends React.Component<IIssueDetailHeaderProps,IIssueDetailHeaderState> {
	
	
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
			
			assert(issue,`Issue should never be null here`)
			
			issue = cloneObject(issue)
		}
		
		return issue
	}
	
	/**
	 * On enter key
	 *
	 * @param event
	 */
	private editSave = (event:React.KeyboardEvent<any> = null) => {
		event && event.preventDefault()
		
		getIssueActions().issueSave(this.state.editIssue)
		this.stopEditingIssue()
	}
	
	/**
	 * On Key down event in edit field
	 *
	 * @param event
	 */
	private onEditKeyDown = (event:React.KeyboardEvent<any>) => {
		log.debug(`Edit key down`, event, event.keyCode,event.key,event.charCode)
		
		event.stopPropagation()
		
		switch (event.key) {
			case 'Enter':
				this.editSave()
				break
			case 'Escape':
				this.stopEditingIssue()
				break
		}
	}
	
	/**
	 * Edit the milestones
	 */
	private editMilestone = () => {
		this.setState({
			editMilestone:true,
			editLabels:true,
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
			editIssue: assign({},this.getEditIssue(),{
				milestone
			})
		}, () => this.editSave())
	}
	
	/**
	 * Edit label
	 */
	private editLabels = () => {
		this.setState({
			editMilestone:true,
			editLabels:true,
			editIssue: this.getEditIssue()
		})
	}
	
	/**
	 * Update the labels
	 *
	 * @param labels
	 */
	private setEditLabels = (labels:Label[]) => {
		this.setState({
			editIssue: assign({},this.getEditIssue(),{
				labels
			})
		}, () => this.editSave())
	}
	
	/**
	 * Assign the issue
	 */
	private editAssignee = () => {
		this.setState({
			editAssignee:true,
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
			editIssue: assign({},this.getEditIssue(),{
				assignee
			})
		}, () => this.editSave())
	}
	
	/**
	 * Edit title
	 */
	private editTitle = () => {
		this.setState({
			editTitle:true,
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
			editIssue: assign({},this.getEditIssue(),{
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
		getIssueActions().applyPatchToIssues({ assignee: null }, true, ...issues)
	
	/**
	 * Callback for label or milestone remove
	 *
	 * @param issue
	 * @param item
	 */
	private removeItem = (issue:Issue, item:Label|Milestone) => {
		
		log.debug(`Removing item from issue`, item)
		
		if (!(item as any).id) {
			const
				label:Label = item as any,
				labels = [ { action: 'remove', label } ] //issue.labels.filter(it => it.url !== label.url)
			
			getIssueActions().applyPatchToIssues({ labels }, true, issue)
		} else {
			getIssueActions().applyPatchToIssues({ milestone: null }, true, issue)
		}
	}
	
	
	/**
	 * When we get new props - check to see if the issue changed
	 *
	 * - if changed, then stop editing
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:IIssueDetailHeaderProps, nextContext:any):void {
		if (!shallowEquals(this.props,nextProps,'selectedIssue')) {
			this.stopEditingIssue()
		}
	}
	
	/**
	 * Render the header
	 */
	render() {
		const
			{ theme, palette,styles,selectedIssue,saving,saveError } = this.props,
			{editLabels, editMilestone, editTitle, editAssignee, editIssue} = this.state,
			
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
		
		return <div style={[styles.root]}>
			
			{/* ROW 1 */}
			<div style={[styles.row1,saving && {opacity: 0}]}>
				
				{/* STATE ICON - CAN TOGGLE ON/OFF */}
				<IssueStateIcon styles={[styles.row1.state]}
				                showToggle={canEdit}
				                issue={issue}/>
				
				<div style={[styles.row1.repo]}>
					<RepoName repo={issue.repo}/>
				</div>
				
				{/* ASSIGNEE */}
				
					<AssigneeSelect
					                assignee={issue.assignee}
					                repoId={issue.repoId}
					                onKeyDown={this.onEditKeyDown}
					                style={makeStyle({opacity: 1, width: 'auto'},makePaddingRem(0,0,0,0),!editAssignee && styles.hidden)}
					                labelStyle={makeStyle(makePaddingRem(0,1,0,0))}
					                avatarStyle={makeStyle(makePaddingRem(0))}
					                onSelect={this.setEditAssignee}/>
					<Avatar user={issue.assignee}
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
				
					<TextField defaultValue={issue.title || ''}
					           onChange={(event,value) => this.setEditTitle(value)}
					           onKeyDown={this.onEditKeyDown}
					           errorStyle={{transform: 'translate(0,1rem)'}}
					           errorText={getGithubErrorText(saveError,'title')}
					           hintText="TITLE"
					           hintStyle={makeStyle(styles.input.hint,{transform: 'translate(1.3rem,-1rem)'})}
					           style={makeStyle(FlexScale,makePaddingRem(1,0),!editTitle && styles.hidden)}
					           inputStyle={styles.input}
					           underlineStyle={styles.underline.disabled}
					           underlineDisabledStyle={styles.underline.disabled}
					           underlineFocusStyle={styles.underline.focus}
					           underlineShow={true}
					           
					           autoFocus/>
					
					<Textfit mode='multi'
					         onClick={canEditIssue(issue.repo,issue) && this.editTitle}
					         style={makeStyle(
					         	styles.title,
					         	canEditIssue(issue.repo,issue) && styles.title.canEdit,
					          editTitle && styles.hidden
				           )}>{issue.title}</Textfit>
				
				{/* TIME */}
				<div
					style={[styles.time,canAssignIssue(issue.repo) && {marginRight:rem(0.5)}]}>{moment(issue.updated_at).fromNow()}</div>
			
			</div>
			
			{/* ROW 3 // LABELS & MILESTONES */}
			<div style={[styles.row3,saving && {opacity: 0}]}>
				
						{/* EDIT MILESTONE*/}
						<MilestoneSelect
							style={makeStyle({width: 'auto',marginRight: rem(1)},!editLabels && styles.hidden)}
							milestone={issue.milestone}
							repoId={issue.repoId}
							underlineShow={false}
							onKeyDown={this.onEditKeyDown}
							onSelect={this.setEditMilestone}
						  />
					<IssueLabelsAndMilestones showIcon={true}
					                          onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
					                          milestones={issue.milestone && [issue.milestone]}
					                          onMilestoneClick={canEditIssue(issue.repo,issue) && (() => this.editMilestone())}
					                          labelStyle={styles.row3.label}
					                          style={makeStyle(styles.row3.milestone,editLabels && styles.hidden)}/>
				
				
				
				
					{/*EDIT MODE*/}
					<LabelFieldEditor
						style={makeStyle(FlexScale,!editLabels && styles.hidden)}
						labels={getValue(() => editIssue.labels,issue.labels)}
						availableLabels={this.props.labels.filter(it => it.repoId === issue.repoId).toArray()}
						onLabelsChanged={this.setEditLabels}
						onKeyDown={this.onEditKeyDown}
						id="issueDetailsLabelEditor"
						hint="Labels"
						mode="normal" />
					
					{/*VIEW MODE*/}
					<IssueLabelsAndMilestones labels={issue.labels}
					                          showIcon={true}
					                          onRemove={canEditIssue(issue.repo,issue) && ((item) => this.removeItem(issue,item))}
					                          labelStyle={styles.row3.label}
					                          afterAllNode={editLabelsControl}
					                          style={makeStyle(styles.row3.labels,editLabels && styles.hidden)}/>
				
			
			</div>
			
			{saving && <div style={[{top:0,left:0,right:0,bottom:0},PositionAbsolute,FlexColumnCenter,Fill]}>
				
					<CircularProgress
						color={theme.progressIndicatorColor}
						size={30}/>
			</div>}
		</div>
	}
	
	
}