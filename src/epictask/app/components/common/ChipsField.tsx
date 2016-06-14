/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {AutoComplete,MenuItem} from 'material-ui'
import * as Models from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender} from 'components/common'

const TextFieldUnderline = require('material-ui/TextField/TextFieldUnderline').default

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, {})
}


function mapStateToProps(state) {
	const appState = state.get(Constants.AppKey)
	return {
		theme: appState.theme
	}
}

/**
 * IChipsFieldProps
 */
export interface IChipsFieldProps<M> extends React.DOMAttributes {
	theme?:any
	style?:any
	modelType:{new():M}
	allChips: M[]
	filterChip: (item:M, query:string) => boolean
	selectedChips: M[]
	onChipSelected: (item:M) => any
	keySource: (item:M) => string|number
}

/**
 * ChipsField
 *
 * @class ChipsField
 * @constructor
 **/

@connect(mapStateToProps)
@Radium
@PureRender
export class ChipsField extends React.Component<IChipsFieldProps<any>,any> {


	constructor(props,context) {
		super(props,context)

		this.state = {isFocused:false,dataSource:this.makeDataSource(this.props.allChips)}
	}


	makeDataSource(models) {
		const newDataSource = models.map(item => {
			return {
				text:  item.name,
				value: <MenuItem primaryText={item.name}/>
			}
		})

		log.info('new data source =',newDataSource)
		return newDataSource
	}


	handleUpdateInput = (newQuery) => {
		const newChipModels = this.props.allChips
			.filter(item => this.props.filterChip(item,newQuery))

		this.setState({dataSource:this.makeDataSource(newChipModels)})

	}


	onSetFocus = (isFocused) => {
		return () => {
			this.setState({isFocused})
		}
	}

	render() {
		const
			{props} =this,
			{theme} = props,
			s = mergeStyles(styles, theme.component),
			underlineDisabledStyle = {},
			underlineFocusStyle = {},
			underlineStyle = {}


		return <div {...props} style={[s.root,props.style]}
		                       onFocus={this.onSetFocus(true)}
		                       onBlur={this.onSetFocus(false)}>
			<div style={[s.chips]}>

				<AutoComplete hintText="Add a label"
				              style={{color: 'black'}}

				              filter={AutoComplete.noFilter}
				              inputStyle={{color: 'black'}}
				              dataSource={this.state.dataSource}
				              onUpdateInput={this.handleUpdateInput}
				              openOnFocus={true}
				/>


			</div>

			<TextFieldUnderline
				error={false}
				errorStyle={{}}
				disabled={false}
				disabledStyle={underlineDisabledStyle}
				focus={this.state.isFocused}
				focusStyle={underlineFocusStyle}
				muiTheme={theme}
				style={underlineStyle}
			/>
		</div>
	}

}