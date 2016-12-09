/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import filterProps from "react-valid-props"
import { Label } from "epic-models"

import { PureRender } from "./PureRender"
import { ChipsField } from "./ChipsField"
import { ThemedStyles, IThemedAttributes } from "epic-styles"


const

// Constants
	log = getLogger(__filename),
	tinycolor = require('tinycolor2'),
	
	
	baseStyles = (topStyles,theme,palette) => {
		const
			{
				accent,
				warn
			} = palette
		
		return [{
			root: [ FlexColumn, FlexAuto, {} ],
			
			
			chipWrapper: [makePaddingRem(0.5, 0,0.5,0.5)],
			
			inputContainer: []
	
			
		}]
	}


function uniqueLabels(labels) {
	return _.uniqBy(labels,'id') as Label[]
}
	
	
/**
 * ILabelFieldEditorProps
 */

export interface ILabelFieldEditorProps extends IThemedAttributes {
	id:string
	label?:string
	hint?:string
	
	inputStyle?:any
	hintStyle?:any
	chipStyle?:any
	labelStyle?:any
	
	onEscape?:Function
	
	labels:Label[]
	availableLabels:Label[]
	onLabelsChanged:(newLabels:Label[]) => void
}

/**
 * LabelFieldEditor
 *
 * @class LabelFieldEditor
 * @constructor
 **/

@ThemedStyles(baseStyles,'labelFieldEditor','chipsField','component')
@PureRender
export class LabelFieldEditor extends React.Component<ILabelFieldEditorProps,any> {
	
	
	
	/**
	 * Create a new state value
	 *
	 * @param props
	 */
	private getNewState(props) {
		const
			{ availableLabels, labels } = props,
			filteredAvailableLabels = _.sortBy(
				_.nilFilter(availableLabels)
					.filter((availLabel:Label) =>
						!labels.find(label => label && label.url === availLabel.url)),
				(label:Label) => _.toLower(label.name)
			)
		
		
		return { availableLabels: filteredAvailableLabels }
	}
	
	/**
	 * Set state on mount
	 */
	componentWillMount():void {
		this.setState(this.getNewState(this.props))
	}
	
	/**
	 * Update state with new props
	 */
	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}
	
	/**
	 * On chip selected
	 *
	 * @param newLabel
	 */
	onChipSelected = (newLabel) => {
		log.debug('selected label', newLabel)
		this.props.onLabelsChanged(uniqueLabels(this.props.labels.concat([ newLabel ])))
	}
	
	/**
	 * Callback when a chip is removed
	 *
	 * @param oldLabel
	 */
	onChipRemoved = (oldLabel) => {
		log.debug('removed label', oldLabel)
		this.props.onLabelsChanged(uniqueLabels(this.props.labels.filter(label => label.url !== oldLabel.url)))
	}
	
	/**
	 * Filter available chips
	 *
	 * @param item
	 * @param query
	 * @returns {boolean}
	 */
	chipFilter = (item:Label, query:string):boolean => {
		return _(item.name).toLower().includes(_.toLower(query))
	}
	
	/**
	 * Create a label color style
	 *
	 * @param item
	 * @returns {{cursor: string, backgroundColor: string, color: any}}
	 */
	labelColorStyle(item:Label) {
		if (!item)
			return null
		
		const
			{ theme } = this.props,
			backgroundColor = '#' + item.color,
			color = tinycolor.mostReadable(backgroundColor, [
				theme.textColor,
				tinycolor(theme.alternateTextColor).lighten(20)
			]).toRgbString()
		
		return {
			cursor: 'pointer',
			backgroundColor,
			color
		}
		
	}
	
	
	render() {
		let
			{ props, state } = this,
			{
				theme,
				labels,
				label,
				id,
				inputStyle,
				labelStyle
			} = props,
			{ availableLabels } = state,
			styles = mergeStyles(this.props.styles)
		
		availableLabels = availableLabels || []
		labels = labels || []
		
		
		return <ChipsField
			{...filterProps(props)}
			id={id}
			
			maxSearchResults={10}
			
			filterChip={this.chipFilter}
			allChips={availableLabels}
			selectedChips={labels}
			onChipSelected={this.onChipSelected}
			onChipRemoved={this.onChipRemoved}
			
			keySource={(item:Label) => item.id}
			
			hint='labels'
			
			onEscape={this.props.onEscape}
			styles={props.styles}
			style={/* FIELD STYLES */ makeStyle(styles.root,props.style)}
						
			inputStyle={/* INPUT STYLES */ makeStyle(styles.input,inputStyle)}
						
			labelStyle={/* LABEL STYLE */ makeStyle(styles.label,labelStyle)}
						
			
		/>
	}
	
}