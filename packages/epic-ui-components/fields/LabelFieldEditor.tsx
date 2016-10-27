/**
 * Created by jglanz on 6/14/16.
 */
// Imports
import * as React from "react"
import { Label } from "epic-models"
import { makeComponentStyles, PureRender, Icon } from "epic-ui-components"
import { ChipsField, TChipsFieldMode } from "./ChipsField"
import { MenuItem } from "material-ui"
import { ThemedStyles } from "epic-styles"


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
		
		return [makeComponentStyles(theme,palette),{
			root: [ FlexColumn, FlexAuto, {} ],
			
			
			
			
			
			chip: [ FlexAuto, PositionRelative, {
				cursor: 'pointer',
				height: '3.4rem',
				padding: '1rem 1rem 0 0',
			} ],
			
			chipContent: makeStyle(FlexAuto, FlexRowCenter, {
				display: 'flex',
				borderRadius: '1.5rem',
				height: '2.4rem',
				
				
				
				control: makeStyle(makeTransition([ 'background-color', 'font-weight', 'border-radius' ]), FlexAuto, FlexRowCenter, {
					padding: '0.2rem 2rem',
					borderRadius: '1.2rem',
					height: '2.4rem',
					width: '2.4rem',
					boxSizing: 'border-box',
					backgroundColor: 'rgba(0,0,0,0.2)',
					cursor: 'pointer',
					fontWeight: 400,
					fontSize: '1.5rem',
					
					':hover': {
						backgroundColor: 'white',
						borderRadius: '0rem',
						fontWeight: 700,
						// fontSize: '2rem',
					}
				}),
				
				label: makeStyle(FlexAuto, FlexRowCenter, OverflowHidden, {
					padding: '0 2rem 0 1rem',
					fontSize: rem(1.5),
					fontWeight: 700
				})
			})
		}]
	}


/**
 * ILabelFieldEditorProps
 */

export interface ILabelFieldEditorProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	style?:any
	id:string
	mode?:TChipsFieldMode
	label?:string
	hint?:string
	
	inputStyle?:any
	hintStyle?:any
	chipStyle?:any
	hintAlways?:boolean
	
	labelStyle?:any
	labelFocusStyle?:any
	
	underlineStyle?:any
	underlineFocusStyle?:any
	underlineDisabledStyle?:any
	underlineShow?:boolean
	
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
					.filter((availLabel:Label) => !labels
						.find(label => label.url === availLabel.url)),
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
	
	chipDataSource = (query) => {
		query = _.toLower(query)
		
		const { availableLabels, labels } = this.props
		
		function testQuery(name:string) {
			return !query || query.length === 0 ||
				_(name).toLower().startsWith(query)
			
		}
		
		function testAvailRepo(availLabel:Label) {
			const selected = !_.isNil(labels.find(label => label.url === availLabel.url))
			return !selected && testQuery(availLabel.name)
		}
		
		
		const results = availableLabels.filter(testAvailRepo)
		log.debug('return available labels', results)
		return results
		
	}
	
	onChipSelected = (newLabel) => {
		log.debug('selected label', newLabel)
		this.props.onLabelsChanged(this.props.labels.concat([ newLabel ]))
	}
	
	onChipRemoved = (oldLabel) => {
		log.debug('removed label', oldLabel)
		this.props.onLabelsChanged(this.props.labels.filter(label => label.url !== oldLabel.url))
	}
	
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
	
	renderChip = (item:Label) => {
		const
			{ theme, chipStyle } = this.props,
			styles = mergeStyles(
				this.props.styles,
				{ chip: chipStyle }
			),
			chipContentStyle = makeStyle(
				styles.chipContent,
				this.labelColorStyle(item)
			)
		
		return <div key={item.url} className='chip' style={styles.chip}>
			<div style={chipContentStyle}>
				<Icon style={styles.chipContent.control}
				      onClick={() => this.onChipRemoved(item)}>
					clear
				</Icon>
				<div style={styles.chipContent.label}>
					{item.name}
				</div>
			</div>
		</div>
	}
	
	renderChipSearchItem = (chipProps:any, item:Label) => {
		const
			{ query } = chipProps,
			itemStyle = this.labelColorStyle(item)
		
		
		const text = query && query.length ?
			item.name.replace(new RegExp(`(${query})`, 'i'), '<strong style="color:yellow;">$1</strong>') :
			item.name
		
		return <MenuItem {...chipProps}
			style={itemStyle}
			primaryText={<span dangerouslySetInnerHTML={{__html:text}}/>}/>
	}
	
	render() {
		let
			{ props, state } = this,
			{
				theme,
				labels,
				label,
				inputStyle,
				labelStyle,
				labelFocusStyle,
				hintStyle,
				hintAlways,
				underlineShow,
				underlineDisabledStyle,
				underlineFocusStyle,
				underlineStyle
			} = props,
			{ availableLabels } = state,
			styles = mergeStyles(this.props.styles)
		
		availableLabels = availableLabels || []
		labels = labels || []
		
		
		return <ChipsField {...props}
			maxSearchResults={5}
			modelType={Label}
			filterChip={this.chipFilter}
			renderChip={this.renderChip}
			renderChipSearchItem={this.renderChipSearchItem}
			allChips={availableLabels}
			selectedChips={labels}
			onChipSelected={this.onChipSelected}
			keySource={(item:Label) => item.url}
						
			style={/* FIELD STYLES */ makeStyle(styles.root,props.style)}
						
			inputStyle={/* INPUT STYLES */ makeStyle(styles.input,inputStyle)}
						
			labelStyle={/* LABEL STYLE */ makeStyle(styles.label,labelStyle)}
			labelFocusStyle={makeStyle(styles.label.focus,labelFocusStyle)}
						
			hintStyle={/* HINT STYLES */ makeStyle(styles.hint,hintStyle)}
			hintAlways={hintAlways}
						
			underlineDisabledStyle={/* UNDERLINE STYLES */ makeStyle(styles.underline.disabled,underlineDisabledStyle)}
			underlineFocusStyle={makeStyle(styles.underline.focus,underlineFocusStyle)}
			underlineStyle={makeStyle(styles.underline,underlineStyle)}
			underlineShow={underlineShow !== false}
			
		/>
	}
	
}