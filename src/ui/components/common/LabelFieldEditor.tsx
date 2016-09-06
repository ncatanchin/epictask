/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Issue,Label,AvailableRepo} from 'shared/models'
import * as Constants from '../../../shared/Constants'
import {PureRender,Icon} from 'ui/components/common'
import {ChipsField} from './ChipsField'
import {MenuItem} from 'material-ui'
import {Themed} from 'shared/themes/ThemeManager'

const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {}),
	chip: makeStyle(PositionRelative,{
		cursor: 'pointer',
		height: '3.4rem',
		padding: '1rem 1rem 0 0',
	}),
	chipContent: makeStyle(FlexAuto,FlexRowCenter,{
		display: 'flex',
		borderRadius: '1.5rem',
		height: '2.4rem',


		control: makeStyle(makeTransition(['background-color','font-weight','border-radius']),FlexAuto,FlexRowCenter,{
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
				fontSize: '2rem',
			}
		}),

		label: makeStyle(FlexAuto,FlexRowCenter,OverflowHidden,{
			padding: '0 2rem 0 1rem',
			fontWeight: 700
		})
	})
}



/**
 * ILabelFieldEditorProps
 */

export interface ILabelFieldEditorProps extends React.HTMLAttributes {
	theme?:any
	style?:any
	id:string

	label?:string
	hint?:string

	inputStyle?:any
	hintStyle?:any
	chipStyle?:any
	hintAlways?:boolean
	underlineStyle?:any
	underlineFocusStyle?:any
	labelStyle?:any
	labelFocusStyle?:any
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

@Radium
@Themed
@PureRender
export class LabelFieldEditor extends React.Component<ILabelFieldEditorProps,any> {


	constructor(props, context) {
		super(props, context)

		this.state = this.getNewState(props)
	}

	getNewState(props) {
		const {availableLabels,labels} = props
		const filteredAvailableLabels = _.sortBy(
			_.nilFilter(availableLabels)
				.filter((availLabel:Label) => !labels
					.find(label => label.url === availLabel.url)),
			(label:Label) => _.toLower(label.name)
		)


		return {availableLabels: filteredAvailableLabels}
	}

	componentWillReceiveProps(nextProps) {
		this.setState(this.getNewState(nextProps))
	}

	chipDataSource = (query) => {
		query = _.toLower(query)

		const {availableLabels,labels} = this.props

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
		log.debug('selected label',newLabel)
		this.props.onLabelsChanged(this.props.labels.concat([newLabel]))
	}

	onChipRemoved = (oldLabel) => {
		log.debug('removed label',oldLabel)
		this.props.onLabelsChanged(this.props.labels.filter(label => label.url !== oldLabel.url))
	}

	chipFilter = (item:Label,query:string):boolean =>  {
		return _(item.name).toLower().includes(_.toLower(query))
	}

	labelColorStyle(item:Label) {
		const
			{theme} = this.props,
			backgroundColor = '#' + item.color,
			color = tinycolor.mostReadable(backgroundColor,[
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
			{theme,chipStyle} = this.props,
			s = mergeStyles(
				styles,
				theme.labelFieldEditor,
				theme.chipsField,
				{chip:chipStyle}
			),
			chipContentStyle = makeStyle(
				s.chipContent,
				this.labelColorStyle(item)
			)

		return <div key={item.url} className='chip' style={s.chip}>
			<div style={chipContentStyle}>
				<Icon style={s.chipContent.control}
				      onClick={() => this.onChipRemoved(item)}>
					clear
				</Icon>
				<div style={s.chipContent.label}>
					{item.name}
				</div>
			</div>
		</div>
	}

	renderChipSearchItem = (chipProps:any,item:Label) => {
		const
			{theme} = this.props,
			{query} = chipProps,
			itemStyle = this.labelColorStyle(item)


		const text = query && query.length ?
			item.name.replace(new RegExp(`(${query})`,'i'),'<strong style="color:yellow;">$1</strong>') :
			item.name

		return <MenuItem {...chipProps}
						 style={itemStyle}
		                 primaryText={<span dangerouslySetInnerHTML={{__html:text}}/>}/>
	}

	render() {
		let
			{props,state} = this,
			{
				theme,
				labels,
				label,
				inputStyle,
				labelStyle,
				hintStyle,
				hintAlways,
				underlineShow
			} = props,
			{availableLabels} = state,
			s = mergeStyles(styles, theme.component)

		availableLabels =  availableLabels || []
		labels = labels || []


		return <ChipsField {...props}
							style={makeStyle(s.root,props.style)}
							maxSearchResults={5}
		                    modelType={Label}
		                    filterChip={this.chipFilter}
		                    renderChip={this.renderChip}
							renderChipSearchItem={this.renderChipSearchItem}
		                    allChips={availableLabels}
		                    selectedChips={labels}
							inputStyle={inputStyle}
							labelStyle={labelStyle}
							hintStyle={hintStyle}
							hintAlways={hintAlways}
							underlineShow={underlineShow !== false}
		                    onChipSelected={this.onChipSelected}
		                    keySource={(item:Label) => item.url}>
		</ChipsField>
	}

}