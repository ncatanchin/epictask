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
import { Label, AvailableRepo } from "epic-models"
import { List } from "immutable"
import { labelsSelector, getRepoActions } from "epic-typedux"
import { getValue } from "epic-global"
import { FlexColumnCenter } from "epic-styles/styles/CommonRules"
import { WorkIndicator, TextField } from "epic-ui-components/common"


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
		
		saving: [FlexColumnCenter,FlexScale],
		
		edit: [{} ],
		
		form: [FlexRowCenter,FlexAuto, makeTransition(['height','max-height','min-height']),{
			hidden: [makeHeightConstraint(0)],
			
			fields: [FlexRowCenter,FillWidth,makePaddingRem(0.5,1),makeHeightConstraint(rem(6)),{
				background: primary.hue2
				
			}],
			name: [ FlexScale,makePaddingRem(0,2,0,0),{} ],
			color: [{}],
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
			
			label: [ FlexAuto, {
				chip: [ {
					fontSize: rem(1.2)
				} ]
			} ],
			spacer: [ FlexScale ],
			actions: [ FlexAuto, makePaddingRem(0, 0, 0, 1) ]
		} ]
	} ]
}


/**
 * IRepoLabelEditorProps
 */
export interface IRepoLabelEditorProps extends IThemedAttributes {
	repo:AvailableRepo
	labels?:List<Label>
}

/**
 * IRepoLabelEditorState
 */
export interface IRepoLabelEditorState {
	label?:Label
	errors?:any
	textFieldRef?:any
	saving?:boolean
}

/**
 * RepoLabelEditor
 *
 * @class RepoLabelEditor
 * @constructor
 **/

@connect(createStructuredSelector({
	labels: labelsSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class RepoLabelEditor extends React.Component<IRepoLabelEditorProps,IRepoLabelEditorState> {
	
	constructor(props,context) {
		super(props,context)
		this.state = {
			label: new Label(),
			errors: {},
			saving: false
		}
	}
	
	private get saving() {
		return this.state.saving === true
	}
	
	private get label() {
		return getValue(() => this.state.label)
	}
	
	private get textField() {
		return getValue(() => this.state.textFieldRef)
	}
	
	private get textFieldElement() {
		return getValue(() => ReactDOM.findDOMNode(this.textField))
	}
	
	private clearLabel = () => {
		this.setState({label: new Label()},() => {
			const
				{textFieldElement} = this,
				input = textFieldElement && $(textFieldElement).find('input')
			
			log.debug(`Clearing element`,textFieldElement,input,this.textField)
			input && input.val('')
		})
	}
	
	
	
	
	/**
	 * Set the label being edited
	 * 
	 * @param label
	 */
	private editLabel = label => this.setState({label})
		
	
	private patchLabel = (patch) => this.setState({
		label: assign(
			{},
			getValue(() => this.state.label, {}),
			patch
		) as any
	})
	
	private onNameChange = (event) => this.patchLabel({
		name: event.target.value
	})
	
	private onColorChange = (event) => {
		this.patchLabel({
			color: getValue(() => event.target.value.replace(/#/,''))
		})
	}
	
	
	private validate() {
		// TODO: Add validation everywhere
		return true
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
				
				await fn()
				
				this.setState({
					label: new Label()
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
	 * On delete handler
	 *
	 * @param label
	 */
	private onDelete = (label:Label) => {
		this.doUpdate(
			() => getRepoActions().deleteLabel(this.props.repo.repo,label) as any
		)
	}
	
	private onSave = () => {
		this.doUpdate(
			async () => {
				try {
					const
						repo = getValue(() => this.props.repo.repo),
						{ label } = this
					
					if (this.validate()) {
						await getRepoActions().saveLabel(repo, label)
						getNotificationCenter().notify(`Saved label: ${label.name}`)
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
	
	
	private isLabelValid = () => {
		const
			{label} = this
		
		return getValue(() => label.name.length,0) && getValue(() => label.color.length,0)
	}
	
	private areActionsVisible = () => {
		const
			{label} = this
		
		return label && (label.url || getValue(() => label.name.length,0) > 0)
	}
	
	render() {
		const 
			{ styles,theme,repo,labels } = this.props,
			{label} = this.state,
			
			labelEditFields = <div key="edit-fields" style={styles.form.fields}>
				<div style={styles.form.name}>
					<TextField placeholder="new label..."
					           styles={{input:Styles.FlexScale}}
					           inputStyle={Styles.FlexScale}
					           ref={(textFieldRef) => this.setState({textFieldRef})}
					           value={getValue(() => this.label.name,"")}
					           onChange={this.onNameChange}/>
				</div>
				<div style={[styles.form.color]}>
					<input type="color" value={getValue(() => `#${this.state.label.color}`)} onChange={this.onColorChange}/>
				</div>
				<div style={[styles.form.actions, !this.areActionsVisible() && styles.form.actions.hide]}>
					<Button
						style={styles.form.button}
						disabled={!this.isLabelValid()}
						onClick={this.onSave}>
						<Icon style={styles.form.button.icon}>
							save
						</Icon> SAVE
					</Button>
				
				
					<Button
						style={styles.form.button}
						onClick={this.clearLabel}>
						<Icon style={styles.form.button.icon}>clear</Icon> CLEAR
					</Button>
				
				</div>
			</div>
			
			return <div style={styles.root}>
				<div style={[styles.form, label.url && styles.form.hidden]}>
					{!label.url && labelEditFields}
				
				</div>
				
				<div style={styles.list}>
					{ this.saving ? <div style={styles.saving}>
						<WorkIndicator />
					</div> :
					labels
						.filter(it => it.repoId === repo.id)
						.map(it => getValue(() => this.label.url === it.url) ?
							labelEditFields :
							
							<div key={it.url}
							     style={styles.row}>
								
								<div style={styles.row.label}>
									<LabelChip
										label={it}
										showIcon
										textStyle={styles.row.label.chip}
									/>
								</div>
								
								<div style={styles.row.spacer}/>
								
								<div style={styles.row.actions}>
									<Button onClick={() => this.editLabel(it)}><Icon>edit</Icon></Button>
								</div>
								<div style={styles.row.actions}>
									<Button onClick={() => this.onDelete(it)}><Icon>delete</Icon></Button>
								</div>
							</div>
						)}
				</div>
			</div>
	}
	
}