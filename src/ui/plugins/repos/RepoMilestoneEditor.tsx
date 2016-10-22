// Imports
import * as moment from 'moment'
import { connect } from 'react-redux'
import { PureRender } from 'ui/components/common/PureRender'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { IThemedAttributes } from "shared/themes/ThemeDecorations"
import { Milestone, AvailableRepo } from "shared/models"
import {TextField,DatePicker} from 'material-ui'
import { List } from "immutable"
import { enabledMilestonesSelector } from "shared/actions/repo/RepoSelectors"
import {
	FillWidth, FlexColumn, FlexScale, OverflowAuto, makeHeightConstraint,
	makeTransition, FlexRowCenter, FlexAuto, makePaddingRem, rem,  makeMarginRem, FillHeight, makeWidthConstraint
} from "shared/themes/styles"
import { getValue } from "shared/util"
import { LabelChip,Button, Icon } from "ui/components/common"
import { getRepoActions } from "shared/actions/ActionFactoryProvider"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
log.setOverrideLevel(LogLevel.DEBUG)


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
	milestones?:List<Milestone>
}

/**
 * IRepoMilestoneEditorState
 */
export interface IRepoMilestoneEditorState {
	milestone?:Milestone
	errors?:any
	textFieldRef?:any
}

/**
 * RepoMilestoneEditor
 *
 * @class RepoMilestoneEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	milestones: enabledMilestonesSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class RepoMilestoneEditor extends React.Component<IRepoMilestoneEditorProps,IRepoMilestoneEditorState> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {
			milestone: new Milestone(),
			errors: {}
		}
	}
	
	
	private get milestone() {
		return getValue(() => this.state.milestone)
	}
	
	private get milestoneDueOn() {
		const
			{milestone} = this,
			dueOn = getValue(() => milestone.due_on)
		
		return dueOn && new Date(dueOn)
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
	 * Set the milestone being edited
	 *
	 * @param milestone
	 */
	private editMilestone = milestone => this.setState({milestone})
	
	
	private patchMilestone = (patch) => this.setState({
		milestone: assign(
			{},
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
	
	private onSave = () => {
		const
			repo = getValue(() => this.props.repo.repo),
			{milestone} = this
		
		if (this.validate())
			getRepoActions().saveMilestone(repo,milestone)
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
			{ styles,repo,milestones } = this.props,
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
					            onChange={this.onDateChange}
					            value={getValue(() => this.milestoneDueOn)}
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
					milestones
						.filter(it => it.repoId === repo.id)
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
									{!it.due_on ? 'no due date' : `due on ` + moment(it.due_on).format('MM-DD-YY')}
								</div>
								<div style={styles.row.actions}>
									<Button onClick={() => this.editMilestone(it)}><Icon>edit</Icon></Button>
								</div>
								<div style={styles.row.actions}>
									<Button onClick={() => {
											getRepoActions().deleteMilestone(repo.repo,it)
										}}><Icon>delete</Icon></Button>
								</div>
							</div>
						)}
			</div>
		</div>
	}
	
}