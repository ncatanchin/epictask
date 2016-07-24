/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
const {Style} = Radium

import {AutoComplete,MenuItem} from 'material-ui'
import {PureRender} from 'components/common'
import {Toaster} from 'shared/Toaster'
import {Container} from 'typescript-ioc'
import {Themed} from 'shared/themes/ThemeManager'
import {HotKeys} from 'react-hotkeys'
import {CommonKeys} from 'shared/KeyMaps'

const TextFieldHint = require('material-ui/TextField/TextFieldHint').default
const TextFieldLabel = require('material-ui/TextField/TextFieldLabel').default
const TextFieldUnderline = require('material-ui/TextField/TextFieldUnderline').default

const toaster = Container.get(Toaster)
//const appActions = new AppActionFactory()

// Constants
const log = getLogger(__filename)
const styles = {
	root: makeStyle(FlexColumn, FlexAuto, PositionRelative, {
		minHeight: 72,
		padding: '1rem 0',
		boxSizing: 'border-box',

		noLabel: {
			minHeight: 30,
			padding: 0
		}
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
		' div.chipAutoComplete.hasValue': {
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

	underlineShow?:boolean
	inputStyle?:any
	hintStyle?:any
	hintAlways?:boolean
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

@Themed
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
		this.setState({dataSource:this.makeDataSource(null,this.props.allChips)})
	}

	componentWillReceiveProps(nextProps) {
		if (this.state && _.isEqual(this.state.allChips,nextProps.allChips))
			return

		this.setState({
			allChips:nextProps.allChips,
			dataSource:this.makeDataSource(null, nextProps.allChips)
		})
	}

	makeDataSource(newQuery,items) {

		const chipProps = {
			query: newQuery || ''
		}

		const newDataSource = items.map(item => {



			return {
				item,
				text:  '',//this.props.keySource(item),
				value: this.props.renderChipSearchItem(chipProps,item)
			}
		})

		log.debug('new data source =',newDataSource)
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
		log.debug('QUery updated',newQuery)
		const newChipModels = this.props.allChips
			.filter(item => this.props.filterChip(item,newQuery))

		this.setState({
			dataSource:this.makeDataSource(newQuery,newChipModels),
			query:newQuery
		})
	}


	onSetFocus = (isFocused) => {
		return () => {
			this.setState({isFocused})
		}
	}

	onItemSelectedOrEnterPressed = (chosenRequest: string, index: number) => {
		log.debug('Selected / Enter', chosenRequest,index)

		const {dataSource} = this.state
		if (!dataSource || !dataSource.length) {
			toaster.addErrorMessage('Come on - try and pick a real item ;)')
			return
		}

		index = index === -1 ? 0 : index

		const {item} = dataSource[index]
		this.onChipSelected(item)
	}

	/**
	 * Key handlers
	 */
	keyHandlers = {
		[CommonKeys.Escape]: () => {
			(ReactDOM.findDOMNode(this) as any).blur()
		}
	}

	render() {
		const
			{state,props} =this,
			{isFocused,dataSource} = state,
			{
				theme,
				selectedChips,
				renderChip,
				id,
				label,
				inputStyle,
				labelStyle,
				labelFocusStyle,
				hint,
				hintStyle,
				hintAlways,
				underlineShow
			} = props,
			s = mergeStyles(styles, theme.component),

			query = this.state.query ? this.state.query : '',

			hasValue = (query && query.length > 0),

			finalInputStyle = makeStyle(
				inputStyle,
				_.mapValues(inputStyle,value => value + ' !important')
			)



		// && {marginTop:'1rem'}
		return <HotKeys {...props}
					handlers={this.keyHandlers}
                   style={makeStyle(s.root,props.style,!label && s.root.noLabel)}
                   onFocus={this.onSetFocus(true)}
                   onBlur={this.onSetFocus(false)}>

			{/*{label && <TextFieldLabel*/}
				{/*muiTheme={theme}*/}
				{/*style={labelStyle}*/}
				{/*shrinkStyle={labelFocusStyle}*/}
				{/*htmlFor={id}*/}
				{/*shrink={hasValue || isFocused}>*/}
				{/*{label}*/}
			{/*</TextFieldLabel>}*/}

			<Style scopeSelector={`#${id}`}
			       rules={_.assign({},s.inputRules,{
						'input': finalInputStyle
			       }) as any} />

			<div style={[s.chips,(label && (isFocused || hasValue)) && s.chips.hasValue]} id={id}>
				{selectedChips.map(item => renderChip(item))}
				<AutoComplete onKeyDown={props.onKeyDown}
							  className='chipAutoComplete'
							  hintText={hint}
				              hintStyle={makeStyle({zIndex: 3,bottom: 5,opacity: !query.length ? 1 : 0},hintStyle)}
				              style={makeStyle(s.input,((hasValue || isFocused) && label))}
				              underlineShow={false}

				              filter={AutoComplete.noFilter}
				              listStyle={{
								paddingTop: 0,
								paddingBottom: 0,
								backgroundColor: 'transparent !important'
							  }}
				              menuProps={{maxHeight:300}}
				              onNewRequest={this.onItemSelectedOrEnterPressed}
				              dataSource={this.state.dataSource}
				              searchText={query}
				              onUpdateInput={this.handleUpdateInput}
				              openOnFocus={true}/>


			</div>


			{/*{hint && <TextFieldHint*/}
				{/*muiTheme={theme}*/}
				{/*show={!query.length}*/}
				{/*style={hintStyle}*/}
				{/*text={hint}*/}
			{/*/>}*/}
			{/*
			{underlineShow && <TextFieldUnderline
				error={false}
				errorStyle={{}}
				disabled={false}
				disabledStyle={{}}
				focus={isFocused}
				focusStyle={props.underlineFocusStyle}
				muiTheme={theme}
				style={props.underlineStyle}
			/>}
			 */}
		</HotKeys>
	}

}