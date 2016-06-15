/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
const {Style} = Radium

import {AutoComplete,MenuItem} from 'material-ui'
import * as Models from 'shared/models'
import * as Constants from 'shared/Constants'
import {PureRender} from 'components/common'
import {AppActionFactory} from 'app/actions/AppActionFactory'
const TextFieldHint = require('material-ui/TextField/TextFieldHint').default
const TextFieldLabel = require('material-ui/TextField/TextFieldLabel').default
const TextFieldUnderline = require('material-ui/TextField/TextFieldUnderline').default

const appActions = new AppActionFactory()

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, PositionRelative, {
		minHeight: 72,
		padding: '10px 0',
		boxSizing: 'border-box'

	}),
	chips: makeStyle(makeTransition(['padding-top']),FlexRow, FlexAuto, PositionRelative, makeFlexAlign('center','flex-start'), {
		flexWrap: 'wrap',
		boxSizing: 'border-box',

		hasValue: {
			paddingTop: 25
		}
	}),



	input: makeStyle({
		flex: '1 0 20rem',
		width: 'auto',
		boxSizing: 'border-box'

	}),

	inputRules: makeStyle({
		'> div:first-child, div.chipAutoComplete': makeStyle({
			display: 'flex !important',
			flexDirection: 'row',
			width: 'auto !important',
			boxSizing: 'border-box'
		}),
		' div.chipAutoComplete': {
			flex: '1 0 20rem !important',
		},
		'> div:first-child > div:first-child': makeStyle({
			boxSizing: 'border-box'
		}),
		' input': {
			width: 'auto !important',
			flex: '1 0 20rem !important',
			boxSizing: 'border-box',
			marginTop: '14px !important',
			padding: '0 1rem !important',
			transform: 'translate(0,-25%)'
		}
	})



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
	id:string

	label?:string
	hint?:string

	modelType:{new():M}
	allChips: M[]
	filterChip: (item:M, query:string) => boolean
	selectedChips: M[]
	onChipSelected: (item:M) => any
	renderChip:(item:M) => any
	renderChipSearchItem:(chipProps:any,item:M) => any
	keySource: (item:M) => string|number

	inputStyle?:any
	hintStyle?:any
	style?:any
	underlineStyle?:any
	underlineFocusStyle?:any
	labelStyle?:any
	labelFocusStyle?:any
	maxSearchResults?:number
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

		this.state = {
			isFocused:false,
			query: null
		}
	}


	componentWillMount() {
		this.setState({dataSource:this.makeDataSource(this.props.allChips)})
	}

	componentWillReceiveProps(nextProps) {
		this.setState({dataSource:this.makeDataSource(nextProps.allChips)})
	}

	makeDataSource(items) {
		const newDataSource = items.map(item => {

			const chipProps = {
				//onClick: () => this.onChipSelected(item)
			}

			return {
				item,
				text:  '',//this.props.keySource(item),
				value: this.props.renderChipSearchItem(chipProps,item)
			}
		})

		log.info('new data source =',newDataSource)
		return newDataSource
	}


	onChipSelected = (item) => {
		this.props.onChipSelected(item)
		this.setState({query:null})
	}

	dataSourceFilter = (query,index) => {
		const {allChips, filterChip} = this.props
		const item = allChips[index]

		return item && filterChip(item,query)
	}

	handleUpdateInput = (newQuery) => {
		log.info('QUery updated',newQuery)
		const newChipModels = this.props.allChips
			.filter(item => this.props.filterChip(item,newQuery))

		this.setState({
			dataSource:this.makeDataSource(newChipModels),
			query:newQuery
		})
	}


	onSetFocus = (isFocused) => {
		return () => {
			this.setState({isFocused})
		}
	}

	onItemSelectedOrEnterPressed = (chosenRequest: string, index: number) => {
		log.info('Selected / Enter', chosenRequest,index)

		const {dataSource} = this.state
		if (!dataSource || !dataSource.length) {
			appActions.addErrorMessage('Come on - try and pick a real item ;)')
			return
		}

		index = index === -1 ? 0 : index

		const {item} = dataSource[index]
		this.onChipSelected(item)
	}


	render() {
		const
			{state,props} =this,
			{isFocused,dataSource,query} = state,
			{theme,selectedChips,renderChip,id,label,hint,inputStyle,labelStyle,labelFocusStyle,hintStyle} = props,
			s = mergeStyles(styles, theme.component),
			hasValue = (query && query !== '') || selectedChips.length > 0



		return <div {...props}
		                       style={[s.root,props.style]}
		                       onFocus={this.onSetFocus(true)}
		                       onBlur={this.onSetFocus(false)}>

			{label && <TextFieldLabel
				muiTheme={theme}
				style={labelStyle}
				shrinkStyle={labelFocusStyle}
				htmlFor={id}
				shrink={hasValue || isFocused}>
				{label}
			</TextFieldLabel>}

			<Style scopeSelector={`#${id}`}
			       rules={_.assign({},s.inputRules,{
						'input': {
							color: inputStyle.color + ' !important',
							backgroundColor: inputStyle.backgroundColor + ' !important',
						}
			       }) as any} />

			<div style={[s.chips,hasValue && s.chips.hasValue]} id={id}>
				{selectedChips.map(item => renderChip(item))}
				<AutoComplete className='chipAutoComplete' hintText={hint}
				              hintStyle={makeStyle(hintStyle,{bottom: -2,opacity: !hasValue && isFocused ? 1 : 0})}
				              style={makeStyle(s.input,inputStyle)}
				              underlineShow={false}
				              filter={AutoComplete.noFilter}
				              listStyle={{
								paddingTop: 0,
								backgroundColor: 'transparent !important'
							  }}
				              menuProps={{
								maxHeight:300
				              }}
				              onNewRequest={this.onItemSelectedOrEnterPressed}
				              dataSource={this.state.dataSource}
				              searchText={this.state.query ? this.state.query : ''}
				              onUpdateInput={this.handleUpdateInput}
				              openOnFocus={true}/>


			</div>


			{/*{hint && <TextFieldHint*/}
				{/*muiTheme={theme}*/}
				{/*show={selectedChips.length < 1}*/}
				{/*style={hintStyle}*/}
				{/*text={hint}*/}
			{/*/>}*/}

			<TextFieldUnderline
				error={false}
				errorStyle={{}}
				disabled={false}
				disabledStyle={{}}
				focus={isFocused}
				focusStyle={props.underlineFocusStyle}
				muiTheme={theme}
				style={props.underlineStyle}
			/>
		</div>
	}

}