// Imports

import { connect } from "react-redux"
import { PureRender, LabelChip, Button, Icon } from "epic-ui-components"
import { createStructuredSelector } from "reselect"
import {
	ThemedStyles,
	IThemedAttributes,
	FillWidth,
	FlexColumn,
	FlexScale,
	OverflowAuto,
	makeHeightConstraint,
	makeTransition,
	FlexRowCenter,
	FlexAuto,
	makePaddingRem,
	rem,
	makeMarginRem,
	FillHeight,
	makeWidthConstraint
} from "epic-styles"
import { Milestone, AvailableRepo } from "epic-models"
import { TextField, DatePicker } from "material-ui"
import { List } from "immutable"
import { milestonesSelector, getRepoActions } from "epic-typedux"
import { getValue } from "epic-global"
import { cloneObjectShallow } from "epic-global/ObjectUtil"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [{
		root: [FlexScale,FlexColumn,FillWidth,FillHeight,{
			
		}],
		
		list: [FlexColumn,FlexScale,OverflowAuto],
		
		edit: [{} ],
		
		form: [FlexRowCenter,FlexAuto, makeTransition(['height','max-height','min-height']),{
			hidden: [makeHeightConstraint(0)],
			
			fields: [FlexRowCenter,FillWidth,makePaddingRem(0.5,1),makeHeightConstraint(rem(6)),{
				background: primary.hue2
				
			}],
			name: [ FlexScale,makePaddingRem(0,2,0,0),{} ],
			dueOn: [{}],
			button: [ FlexAuto, FlexRowCenter, makePaddingRem(0.5, 1, 1),makeMarginRem(0.5,0,0.5,1),makeHeightConstraint(rem(3)),{
				fontSize: rem(1.4),
				
				icon: [makePaddingRem(0,1,0,0),{
					fontSize: rem(1.8)
				}]
			} ],
			
			actions: [
				FlexRowCenter,
				makeTransition(['width','max-width','min-width']),
				makeWidthConstraint(rem(20)),
				{
					hide: [makeWidthConstraint(0),{
						
					}]
				}
			]
		} ],
		
		row: [ FillWidth, FlexRowCenter, FlexAuto, makePaddingRem(1), {
			
			milestone: [ FlexAuto, {
				chip: [ {
					fontSize: rem(1.2)
				} ],
				
				dueOn: [FlexAuto,makePaddingRem(0,1),{
					color: text.secondary,
					fontSize: rem(1.2),
					fontWeight: 400
				}]
			} ],
			spacer: [ FlexScale ],
			actions: [ FlexAuto, makePaddingRem(0, 0, 0, 1) ]
		} ]
	} ]
}


/**
 * IRepoMilestoneEditorProps
 */
export interface IRepoMilestoneEditorProps extends IThemedAttributes {
	repo:AvailableRepo
}

/**
 * IRepoMilestoneEditorState
 */
export interface IRepoMilestoneEditorState {
	milestone?:Milestone
	errors?:any
	textFieldRef?:any
	saving?:boolean
}

/**
 * RepoMilestoneEditor
 *
 * @class RepoMilestoneEditor
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class RepoMilestoneEditor extends React.Component<IRepoMilestoneEditorProps,IRepoMilestoneEditorState> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {
			milestone: new Milestone(),
			errors: {},
			saving: false
		}
	}
	
	private get saving() {
		return this.state.saving === true
	}
	
	private get milestone() {
		return getValue(() => this.state.milestone)
	}
	
	private get milestoneDueOn() {
		const
			{milestone} = this,
			dueOn = getValue(() => milestone.due_on)
		
		return dueOn && new Date(moment(dueOn).utc().valueOf())
	}
	
	private formatDate = (date) => {
		return moment(date).utc().format('MM-DD-YY')
	}
	
	private get textField() {
		return getValue(() => this.state.textFieldRef)
	}
	
	private get textFieldElement() {
		return getValue(() => ReactDOM.findDOMNode(this.textField))
	}
	
	private clearMilestone = () => {
		this.setState({milestone: new Milestone()},() => {
			// const
			// 	{textFieldElement} = this,
			// 	input = textFieldElement && $(textFieldElement).find('input')
			//
			// log.debug(`Clearing element`,textFieldElement,input,this.textField)
			// input && input.val('')
		})
	}
	
	/**
	 * Execute an update fn
	 *
	 * @param fn
	 */
	private doUpdate(fn:() => Promise<any>) {
		if (this.saving)
			return
		
		this.setState({
			saving: true
		},async () => {
			try {
				
				// EXECUTE THE FUNCTION - ON FAIL CLEAR
				await fn()
				
				this.setState({
					milestone: new Milestone()
				})
			} catch (err) {
				log.error('updated failed',err)
				
			}finally {
				this.setState({
					saving:false
				})
			}
			
		})
	}
	
	
	
	/**
	 * Set the milestone being edited
	 *
	 * @param milestone
	 */
	private editMilestone = milestone => this.setState({milestone})
	
	
	private patchMilestone = (patch) => this.setState({
		milestone: cloneObjectShallow(
			getValue(() => this.state.milestone, {}),
			patch
		) as any
	})
	
	private onTitleChange = (event) => this.patchMilestone({
		title: event.target.value
	})
	
	private onDateChange = (event,date:Date) => {
		this.patchMilestone({
			due_on: moment(date).format()
		})
	}
	
	
	private validate() {
		// TODO: Add validation everywhere
		return true
	}
	
	private onDelete = (milestone) => {
		this.doUpdate(
			() => getRepoActions().deleteMilestone(this.props.repo.repo,milestone) as any
		)
	}
	
	
	/**
	 * On save handler
	 */
	private onSave = () => {
		this.doUpdate(
			async () => {
				try {
					const
						repo = getValue(() => this.props.repo.repo),
						{ milestone } = this
					
					log.debug(`Saving milestone`,milestone)
					if (this.validate()) {
						await getRepoActions().saveMilestone(repo, milestone)
						getNotificationCenter().notify(`Saved label: ${milestone.title}`)
					} else {
						//noinspection ExceptionCaughtLocallyJS
						throw new Error(`Invalid tag name or color`)
					}
					
					
				} catch (err) {
					log.error(`Failed to save label`,err)
					getNotificationCenter().notifyError(`Unable to persist label: ${err.message}`)
				}
			}
		)
		
	}
	
	
	private isMilestoneValid = () => {
		const
			{milestone} = this
		
		return getValue(() => milestone.title.length,0)
	}
	
	private areActionsVisible = () => {
		const
			{milestone} = this
		
		return milestone && (milestone.id || this.isMilestoneValid())
	}
	
	
	
	render() {
		const
			{ styles,repo } = this.props,
			{milestone,milestoneDueOn} = this,
			
			milestoneEditFields = <div key="edit-fields" style={styles.form.fields}>
				<div style={styles.form.name}>
					<TextField hintText="new milestone..."
					           ref={(textFieldRef) => this.setState({textFieldRef})}
					           value={getValue(() => this.milestone.title,"")}
					           fullWidth={true}
					           onChange={this.onTitleChange}/>
				</div>
				<div style={[styles.form.dueOn]}>
					<DatePicker hintText="due on"
					            mode="landscape"
					            autoOk={true}
					            formatDate={this.formatDate}
					            onChange={this.onDateChange}
					            value={milestoneDueOn}
					            container="inline"
					/>
				</div>
				<div style={[styles.form.actions, !this.areActionsVisible() && styles.form.actions.hide]}>
					<Button
						style={styles.form.button}
						disabled={!this.isMilestoneValid()}
						onClick={this.onSave}>
						<Icon style={styles.form.button.icon}>
							save
						</Icon> SAVE
					</Button>
					
					
					<Button
						style={styles.form.button}
						onClick={this.clearMilestone}>
						<Icon style={styles.form.button.icon}>clear</Icon> CLEAR
					</Button>
				
				</div>
			</div>
		
		return <div style={styles.root}>
			<div style={[styles.form, milestone.url && styles.form.hidden]}>
				{!milestone.url && milestoneEditFields}
			
			</div>
			
			<div style={styles.list}>
				{
					repo.milestones
						.map(it => getValue(() => this.milestone.url === it.url) ?
							milestoneEditFields :
							<div key={it.url}
							     style={styles.row}>
								<div style={styles.row.milestone}>
									<LabelChip
										label={it}
										showIcon
										textStyle={styles.row.milestone.chip}
									/>
								</div>
								<div style={styles.row.spacer}/>
								<div style={styles.row.milestone.dueOn}>
									{!it.due_on ? 'no due date' : `due on ` + moment(it.due_on).utc().format('MM-DD-YY')}
								</div>
								
								{/* EDIT */}
								<div style={styles.row.actions}>
									<Button onClick={() => this.editMilestone(it)}>
										<Icon>edit</Icon>
									</Button>
								</div>
								
								{/* DELETE */}
								<div style={styles.row.actions}>
									<Button onClick={() => {
											this.onDelete(it)
										}}><Icon>delete</Icon></Button>
								</div>
							</div>
						)}
			</div>
		</div>
	}
	
}