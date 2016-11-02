/**
 * Created by jglanz on 6/14/16.
 */

// Imports

import {PureRender} from "../common/PureRender"

import {CommonKeys} from 'epic-command-manager'
import {TypeAheadSelect} from "./TypeAheadSelect"
import { shallowEquals } from  "epic-global"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder
} from  "epic-command-manager-ui"

import filterProps from 'react-valid-props'
import { ThemedStyles, IThemedAttributes } from "epic-styles"

export type TChipsFieldMode = 'fixed-scroll-x'|'normal'

const
	{Style} = Radium,
	toaster =getNotificationCenter(),
	log = getLogger(__filename)

const baseStyles = (topStyles,theme,palette) => ({
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
export interface IChipsFieldProps<M> extends IThemedAttributes {
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
	
	underlineStyle?: any
	underlineFocusStyle?: any
	underlineDisabledStyle?:any
	underlineShow?: boolean
	inputStyle?: any
	hintStyle?: any
	hintAlways?: boolean
	style?: any
	
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


@CommandComponent()
@ThemedStyles(baseStyles)
@PureRender
export class ChipsField extends React.Component<IChipsFieldProps<any>,any> implements ICommandComponent {
	
	
	commandItems = (builder:CommandContainerBuilder) =>
		builder.make()
	
	get commandComponentId():string {
		return `ChipsField-${this.props.id}`
	}
	
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
	
	/**
	 * Create focus handler
	 *
	 * @param isFocused
	 */
	private onSetFocus = (isFocused) => () => this.setState({isFocused})
	
	/**
	 * onFocus handler
	 */
	onFocus = this.onSetFocus(true)
	
	/**
	 * onBlur handler
	 */
	onBlur = this.onSetFocus(false)

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
				styles,
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
				underlineShow,
				underlineDisabledStyle,
				underlineFocusStyle,
				underlineStyle
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
				underlineDisabledStyle={underlineDisabledStyle}
				underlineFocusStyle={underlineFocusStyle}
				underlineStyle={underlineStyle}
				underlineShow={underlineShow}
				menuProps={{maxHeight:300}}
				onItemSelected={this.onItemSelectedOrEnterPressed}
				onInputChanged={this.handleUpdateInput}
				dataSource={this.state.dataSource}
				query={query}
				fullWidth={true}
				openOnFocus={true}/>

		return <CommandRoot
			{...filterProps(props)}
			component={this}
			style={makeStyle(s.root,props.style,!label && s.root.noLabel)}
			>

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
		</CommandRoot>
	}

}