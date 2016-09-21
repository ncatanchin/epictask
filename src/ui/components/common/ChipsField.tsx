/**
 * Created by jglanz on 6/14/16.
 */

// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
const {Style} = Radium

import {AutoComplete, MenuItem} from 'material-ui'
import {PureRender} from 'ui/components/common'
import {Toaster} from 'shared/Toaster'
import {Container} from 'typescript-ioc'
import {Themed, ThemedNoRadium} from 'shared/themes/ThemeManager'
import { HotKeys } from "ui/components/common/Other"
import {CommonKeys} from 'shared/KeyMaps'
import {TypeAheadSelect} from 'ui/components/common/TypeAheadSelect'
import { shallowEquals } from "shared/util/ObjectUtil"

export type TChipsFieldMode = 'fixed-scroll-x'|'normal'

const
	toaster = Container.get(Toaster),
	log = getLogger(__filename)

const styles = createStyles({
	root: makeStyle(FlexColumn, FlexAuto, PositionRelative, {
		minHeight: 72,
		padding: '1rem 0',
		boxSizing: 'border-box',

		noLabel: {
			minHeight: 30,
			padding: 0
		}
	}),
	chips: makeStyle(makeTransition(['padding-top']), FlexRow, FlexAuto, PositionRelative, makeFlexAlign('center', 'flex-start'), {
		flexWrap: 'wrap',
		boxSizing: 'border-box',

		hasValue: {
			paddingTop: 25
		},
		
		
		// Fixed scroll mode
		'fixed-scroll-x': {
			flexWrap: 'nowrap',
			overflowX: 'auto'
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
			//width: 'auto !important',
			flex: '1 0 20rem !important',
			boxSizing: 'border-box',
			marginTop: '14px !important',
			padding: '0 1rem !important',
			transform: 'translate(0,-25%)'
		}
	})


})


/**
 * IChipsFieldProps
 */
export interface IChipsFieldProps<M> extends React.HTMLAttributes<any> {
	theme?: any
	id: string

	label?: string
	hint?: string

	modelType: {new(): M}
	allChips: M[]
	filterChip: (item: M, query: string) => boolean
	selectedChips: M[]
	onChipSelected: (item: M) => any
	renderChip: (item: M) => any
	renderChipSearchItem: (chipProps: any, item: M) => any
	keySource: (item: M) => string|number
	mode?:TChipsFieldMode

	underlineShow?: boolean
	inputStyle?: any
	hintStyle?: any
	hintAlways?: boolean
	style?: any
	underlineStyle?: any
	underlineFocusStyle?: any
	labelStyle?: any
	labelFocusStyle?: any
	maxSearchResults?: number
}


/**
 * ChipsField
 *
 * @class ChipsField
 * @constructor
 **/

@Themed
@PureRender
export class ChipsField extends React.Component<IChipsFieldProps<any>,any> {
	
	
	/**
	 * Create a new datasource
	 *
	 * @param newQuery
	 * @param items
	 * @returns {any}
	 */
	private makeDataSource(newQuery, items) {
		
		const chipProps = {
			query: newQuery || ''
		}
		
		const newDataSource = items.map(item => ({
			item,
			text: '',//this.props.keySource(item),
			value: this.props.renderChipSearchItem(chipProps, item)
		}))
		
		log.debug('new data source =', newDataSource)
		return newDataSource
	}
	
	/**
	 * Make sure the state is up to date
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		if (shallowEquals(this.state,props,'allChips'))
			return
		
		
		const
			stateUpdate = this.state ? {} : {
				isFocused: false,
				query: null
			} as any
		
		// UPDATE DATASOURCE ON STATE
		this.setState(assign(stateUpdate,{
			allChips: props.allChips,
			dataSource: this.makeDataSource(null, props.allChips)
		}))
	}
	
	/**
	 * Update state on mount
	 */
	componentWillMount = this.updateState
	
	
	/**
	 * Update state on new props if chips changed
	 */
	componentWillReceiveProps = this.updateState
		

	


	private onChipSelected = (item) => {
		this.props.onChipSelected(item)
		this.setState({query: null})
	}

	private dataSourceFilter = (query, index) => {
		const {allChips, filterChip} = this.props
		const item = allChips[index]

		return item && filterChip(item, query)
	}

	private handleUpdateInput = (newQuery) => {
		const newChipModels = this.props.allChips
			.filter(item => this.props.filterChip(item, newQuery))

		this.setState({
			dataSource: this.makeDataSource(newQuery, newChipModels),
			query: newQuery
		})
	}


	private onSetFocus = (isFocused) => {
		return () => {
			this.setState({isFocused})
		}
	}

	private onItemSelectedOrEnterPressed = (chosenRequest: string, index: number) => {
		log.debug('Selected / Enter', chosenRequest, index)

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
	private keyHandlers = {
		[CommonKeys.Escape]: () => {
			(ReactDOM.findDOMNode(this) as any).blur()
		}
	}

	render() {
		const
			{state, props} =this,
			{isFocused, dataSource} = state,
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
				_.mapValues(inputStyle, value => value + ' !important')
			)
		
		const
			inputField = <TypeAheadSelect
				onKeyDown={props.onKeyDown}
				className='chipAutoComplete'
				hintText={hint.toUpperCase()}
				underlineShow={false}
				menuProps={{maxHeight:300}}
				onItemSelected={this.onItemSelectedOrEnterPressed}
				onInputChanged={this.handleUpdateInput}
				dataSource={this.state.dataSource}
				query={query}
				fullWidth={true}
				openOnFocus={true}/>

		// && {marginTop:'1rem'}
		return <HotKeys {...props}
			handlers={this.keyHandlers}
			style={makeStyle(s.root,props.style,!label && s.root.noLabel)}
			onFocus={this.onSetFocus(true)}
			onBlur={this.onSetFocus(false)}>

			<Style scopeSelector={`#${id}`}
			       rules={_.assign({},s.inputRules,{
						'input': finalInputStyle
			       }) as any}/>

			<div style={[s.chips,s.chips[props.mode || 'normal'],(label && (isFocused || hasValue)) && s.chips.hasValue]} id={id}>
				{selectedChips.map(item => renderChip(item))}
				
				{props.mode === 'normal' && inputField}

			</div>
			
			{props.mode === 'fixed-scroll-x' && inputField}

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