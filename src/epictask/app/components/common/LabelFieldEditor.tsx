/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {Issue,Label,AvailableRepo} from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender} from 'components/common'
import {ChipsField} from './ChipsField'
import {MenuItem} from 'material-ui'

const tinycolor = require('tinycolor2')

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {}),
	chip: makeStyle(FlexAuto,FlexRowCenter,{
		display: 'flex',
		padding: '0.4rem 2rem',
		borderRadius: '1.5rem',
		height: '3rem',
		fontWeight: 700
	})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * ILabelFieldEditorProps
 */
export interface ILabelFieldEditorProps extends React.DOMAttributes {
	theme?:any
	id:string

	label?:string
	hint?:string

	inputStyle?:any
	hintStyle?:any
	underlineStyle?:any
	underlineFocusStyle?:any
	labelStyle?:any
	labelFocusStyle?:any

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

@connect(mapStateToProps)
@Radium
//@PureRender
export class LabelFieldEditor extends React.Component<ILabelFieldEditorProps,any> {


	constructor(props, context) {
		super(props, context)

		this.state = this.getNewState(props)
	}

	getNewState(props) {
		const {availableLabels,labels} = props
		const filteredAvailableLabels = availableLabels
			.filter(availLabel => !labels.find(label => label.url === availLabel.url))

		const newState = {availableLabels: filteredAvailableLabels}
		return newState
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
		log.info('return available labels', results)
		return results

	}

	onChipSelected = (newLabel) => {
		log.info('selected label',newLabel)
		this.props.onLabelsChanged(this.props.labels.concat([newLabel]))
	}

	chipFilter = (item:Label,query:string):boolean =>  {
		return _(item.name).toLower().startsWith(_.toLower(query))
	}

	labelColorStyle(item:Label) {
		const
			{theme} = this.props,
			backgroundColor = '#' + item.color,
			color = tinycolor.mostReadable(backgroundColor,[
				theme.textColor,
				theme.alternateTextColor
			]).toRgbString()

		return {
			backgroundColor,
			color
		}

	}

	renderChip = (item:Label) => {
		const
			{theme} = this.props,
			s = mergeStyles(styles, theme.component),
			chipStyle = makeStyle(s.chip,this.labelColorStyle(item))

		return <div key={item.url} className='chip' style={chipStyle}>
			<div>{item.name}</div>
		</div>
	}

	renderChipSearchItem = (item:Label) => {
		const {theme} = this.props,
			itemStyle = this.labelColorStyle(item)



		return <MenuItem onClick={() => this.onChipSelected(item)}
		                 style={itemStyle}
		                 primaryText={item.name}/>
	}

	render() {
		let
			{props,state} = this,
			{theme,labels} = props,
			{availableLabels} = state,
			s = mergeStyles(styles, theme.component)

		availableLabels =  availableLabels || []
		labels = labels || []



		return <ChipsField {...props}
							style={s.root}
							maxSearchResults={5}
		                    modelType={Label}
		                    filterChip={this.chipFilter}
		                    renderChip={this.renderChip}
							renderChipSearchItem={this.renderChipSearchItem}
		                    allChips={availableLabels}
		                    selectedChips={labels}
		                    onChipSelected={this.onChipSelected}
		                    keySource={(item:Label) => item.url}>
		</ChipsField>
	}

}