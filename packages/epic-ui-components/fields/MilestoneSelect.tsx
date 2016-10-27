// Imports
import * as React from "react"
import { connect } from "react-redux"
import { List } from "immutable"
import { PureRender, LabelChip } from "epic-ui-components"
import { shallowEquals } from "epic-global"
import { createStructuredSelector } from "reselect"
import { ThemedStyles } from "epic-styles"
import { Milestone } from "epic-models"
import { Select, ISelectItem } from "./Select"
import { enabledMilestonesSelector } from "epic-typedux"
import filterProps from "react-valid-props"

// Constants
const log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
	root: [ FlexColumn, FlexAuto, {} ],
	
	labelChip: [{
		//height: '3rem',
		borderRadius: '1.5rem',
		height: '2.4rem',
		
		text: [FlexScale,Ellipsis,{
			flexShrink: 1,
			fontWeight: 700,
			fontSize: rem(1.5),
		}]
	}]
})


/**
 * IMilestoneSelectProps
 */
export interface IMilestoneSelectProps {
	theme?:any
	styles?:any
	style?:any
	iconStyle?:any
	onKeyDown?:(event:React.KeyboardEvent<any>) => any
	underlineShow?:boolean
	
	milestones?:List<Milestone>
	milestone:Milestone
	onSelect: (milestone:Milestone) => any
	repoId:number
}

/**
 * IMilestoneSelectState
 */
export interface IMilestoneSelectState {
	items:ISelectItem[]
}

/**
 * MilestoneSelect
 *
 * @class MilestoneSelect
 * @constructor
 **/

@connect(createStructuredSelector({
	milestones: enabledMilestonesSelector
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class MilestoneSelect extends React.Component<IMilestoneSelectProps,IMilestoneSelectState> {
	
	static defaultProps = {
		underlineShow: true
	}
	
	/**
	 * Create Label
	 *
	 * @param milestone
	 * @returns {any}
	 */
	private makeItemNode = (milestone:Milestone) => {
		const
			{styles} = this.props
		
		return <LabelChip key={milestone.id}
		                  label={milestone}
		                  labelStyle={styles.labelChip}
		                  textStyle={styles.labelChip.text}
		                  showIcon={true}/>
		
	}
	
	/**
	 * Create menu items
	 *
	 * @param milestones
	 * @returns {any[]}
	 */
	makeItems(milestones:List<Milestone>) {
		
		const
			{
				styles
			} = this.props,
			
			items = [{
				key: 'empty-milestone',
				value: '',
				node: this.makeItemNode(Milestone.EmptyMilestone)
			}] as ISelectItem[]
			
		
		
		
		return items.concat(milestones.map(milestone => ({
			key: milestone.url,
			value: milestone.id,
			node: this.makeItemNode(milestone),
			data: milestone
		})).toArray())
	}
	
	/**
	 * Create items and required elements
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		this.setState({
			items: this.makeItems(props
				.milestones
				.filter(it => it.repoId === props.repoId) as List<Milestone>)
				
		})
	}
	
	/**
	 * On change, notify
	 *
	 * @param item
	 */
	private onSelect = (item:ISelectItem) => {
			this.props.onSelect(item && item.data as Milestone)
	}
	
	/**
	 * On mount always create items
	 */
	componentWillMount = this.updateState
	
	/**
	 * On new props - update items if required
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:IMilestoneSelectProps, nextContext:any):void {
		if (!shallowEquals(this.props,nextProps,'milestones','milestone','repoId'))
			this.updateState(nextProps)
	}
	
	/**
	 * Render the select
	 *
	 * @returns {any}
	 */
	render() {
		const
			{underlineShow, theme, iconStyle,styles,milestone } = this.props,
			{items} = this.state
		
		
		//labelStyle={styles.form.milestone.item.label}
		return <Select
			{...filterProps(this.props)}
			underlineShow={underlineShow}
			labelStyle={{paddingTop: rem(1)}}
			iconStyle={makeStyle(styles.icon,iconStyle)}
			itemStyle={makeStyle(FlexRow,FillWidth,{alignItems: 'flex-start',paddingLeft: 0})}
			value={milestone ? milestone.id : ''}
			items={items}
			onSelect={this.onSelect}
		>
			
		</Select>
	}
	
}