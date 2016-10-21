/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import {List} from 'immutable'
import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {TextField} from 'material-ui'
import * as KeyMaps from 'shared/KeyMaps'
import {SearchResult, SearchType} from 'shared/actions/search/SearchState'
import {SearchResults} from './SearchResults'

import {PureRender} from 'ui/components/common/PureRender'
import { isNumber, getValue } from "shared/util"
import SearchProvider from "shared/actions/search/SearchProvider"
import { SearchItem, ISearchState } from "shared/actions/search"
import {SearchEvent} from "shared/actions/search/SearchProvider"
import {
	CommandComponent, ICommandComponent, CommandRoot,
	CommandContainerBuilder, CommandContainer,CommandType,getCommandManager
} from "shared/commands"

import { CommonKeys } from "shared/KeyMaps"
import { ThemedStyles } from "shared/themes/ThemeDecorations"




const $ = require('jquery')

// Key mapping tools
const {CommonKeys:Keys} = KeyMaps

// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


// STYLES
const baseStyles = (topStyles,theme,palette) => {
	const
		{primary,accent,text} = palette
	
	
	return [{
		wrapper: [PositionRelative,FillWidth,{
			borderRadius: rem(0.2),
			backgroundColor: Transparent,
			
			
			expanded: [OverflowAuto,PositionAbsolute, {
				left: 0,
				top: '50%',
				width: '70%',
				maxWidth: '70%',
				height: '40%',
				maxHeight: '40%',
				minHeight: '40%'
			}]
		}],
		hint: [{
			backgroundColor: 'transparent',
			color: text.secondary,
			fontWeight: 400
		}],
		
		field: [FillWidth,PositionRelative,{
			
			
			wrapper: [PositionRelative,OverflowAuto,FillWidth,FlexColumn,{
				maxHeight: '100%'
			}],
			
			input: [FillWidth,makeTransition(['color','background-color','border','padding']),{
				backgroundColor: 'transparent',
				color: text.secondary,
				
				
			}],
		}],
		
		
		
		focused: [{
			backgroundColor: primary.hue4,
			color: text.primary
		}]
	}]
}

/**
 * ISearchPanelProps
 */
export interface ISearchPanelProps extends React.HTMLAttributes<any> {
	theme?: any
	styles?:any
	commandContainer?:CommandContainer
	
	allowEmptyQuery?:boolean
	perSourceLimit?:number
	
	panelStyle?:any
	inputStyle?:any
	fieldStyle?:any
	underlineStyle?:any
	underlineFocusStyle?:any
	
	
	
	hint?:any
	hintStyle?:any
	
	resultStyle?:any
	
	searchId: string
	types: SearchType[]
	modal?: boolean
	inlineResults?: boolean
	expanded?: boolean
	
	focused?: boolean
	resultsHidden?: boolean
	hidden?: boolean
	mode: "repos"|"issues"|"actions"
	onEscape?: () => any
	onResultsChanged?: (items: SearchItem[]) => void
	onResultSelected?: (item: SearchItem) => void
}

export type TSearchSelectionListener = (selectedIndex:number,id:any) => any

export interface ISearchPanelState {
	focused?: boolean
	totalItemCount?: number
	selected?: boolean
	query?: string
	textField?: any
	resultsListRef?:any
	selectionListeners?:TSearchSelectionListener[]
	provider?:SearchProvider
	results?:SearchResult[]
	searchState?:ISearchState
	unsubscribe?:Function
}


/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/

@CommandComponent()
@ThemedStyles(baseStyles,'searchPanel')
@PureRender
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> implements ICommandComponent {

	static defaultProps? = {
		inlineResults: false,
		expanded: false,
		modal: false,
		perSourceLimit: 5,
		allowEmptyQuery: false,
		hint: <span>Search issues, comments, labels &amp; milestones</span>
	}
	
	
	private mounted = false
	
	/**
	 * Commands
	 */
	commandItems = (builder:CommandContainerBuilder) =>
		builder
		//MOVEMENT
			.command(
				CommandType.Container,
				'Move down',
				(cmd,event) => this.moveSelection(1),
				CommonKeys.MoveDown,{
					hidden:true,
					overrideInput: true
				})
			.command(
				CommandType.Container,
				'Move up',
				(cmd,event) => this.moveSelection(-1),
				CommonKeys.MoveUp,{
					hidden:true,
					overrideInput: true
				})
			
			// ESCAPE
			.command(
				CommandType.Container,
				'Close results',
				(cmd,event) => {
					const
						{onEscape} = this.props
					
					log.info('Escape key received', event, onEscape)
					if (onEscape && onEscape() === true) {
						(this.textField as any).blur()
					}
					//this.onBlur(event)
					
				},
				CommonKeys.Escape,{
					hidden:true,
					overrideInput: true
				})
			
			// SELECT
			.command(
				CommandType.Container,
				'Select this issue',
				(cmd,event) => {
					event.preventDefault()
					event.stopPropagation()
					this.onResultSelected(null)
						
				},
				CommonKeys.Enter,{
					hidden:true,
					overrideInput: true
				})
			
			
			
			.make()
	
	
	/**
	 * Command container id
	 */
	get commandComponentId():string {
		const
			componentId = `SearchPanel-${this.props.searchId}`
		log.debug(`Search panel with id = ${componentId}`)
		return componentId
	}
	
	constructor(props, context) {
		super(props, context)

		this.state = {
			selectionListeners:[],
			searchState:{
				items:List<SearchItem>(),
				results: [],
				provider:null,
				selectedIndex: 0
			}
		}
	}

	
	addSelectionListener(listener:TSearchSelectionListener) {
		const
			{selectionListeners} = this.state
		
		if (selectionListeners.indexOf(listener) === -1)
			selectionListeners.push(listener)
		
		
	}
	
	removeSelectionListener(listener:TSearchSelectionListener) {
		const
			{selectionListeners} = this.state,
			index = selectionListeners.indexOf(listener)
		
		if (index > -1)
			selectionListeners.splice(index,1)
		
		
		
	}
	
	

	/**
	 * Get the textField component
	 * @returns {any}
	 */
	get textField(): React.Component<any,any> {
		return getValue(() => this.state.textField) as any
	}

	/**
	 * Get the underlying text field element
	 *
	 * @returns {E|Element}
	 */
	get textFieldElement() {
		return getValue(() => ReactDOM.findDOMNode(this.textField))
	}

	/**
	 * get the input element
	 *
	 * @returns {null}
	 */
	get inputElement() {
		const {textFieldElement} = this


		return (textFieldElement) ? $('input', textFieldElement)[0] : null
	}

	/**
	 * get the current query string
	 *
	 * @returns {string}
	 */
	get query(): string {
		return _.get(this.state, 'query',
				_.get(this.props, 'searchData.search.query')) as string || ''
	}


	/**
	 * Is the input element focused
	 *
	 * @param props
	 */
	isFocused = (props = this.props): boolean => {
		return getValue(() => this.state.focused,false) || props.commandContainer.isFocused()
	}
		
	
	
	/**
	 * Flatten all items in a result set
	 *
	 * @param results
	 * @returns {SearchItem[]}
	 */
	getItems(results:SearchResult[] = []):List<SearchItem> {
		return results.reduce((allItems,result) => {
			const
				{perSourceLimit} = this.props
			
			let
				{items} = result
			
			items = (!perSourceLimit || perSourceLimit < 1 || result.items.size <= perSourceLimit) ?
				items :
				items.slice(0,perSourceLimit) as List<SearchItem>
			
			return allItems.concat(items) as List<SearchItem>
		},List<SearchItem>())
	}
	
	
	/**
	 * Create the search provider
	 *
	 * @param props
	 */
	createSearchProvider(props = this.props) {
		const
			provider = new SearchProvider(this.props.searchId)
		
		provider.setTypes(...props.types)
		provider.allowEmptyQuery = props.allowEmptyQuery
		
		return provider
	}
	
	/**
	 * Calculate a new state
	 *
	 * @param props
	 * @param focused
	 */
	getNewState = (props: ISearchPanelProps, focused: boolean) => {
		
		const
			newState:any = {focused}
		
		let
			provider:SearchProvider = getValue(() => this.state.provider)
		
		if (!provider) {
			provider = newState.provider = this.createSearchProvider(props)
			
			newState.unsubscribe = provider.addListener(
				SearchEvent.ResultsUpdated,
				(newResults:SearchResult[]) => {
					
					log.info(`New Results received`,newResults)
					
					this.setState({
						results:newResults,
						searchState: assign({},assign(searchState,{results:newResults}))
					},this.updateState as any)
					
					if (this.props.onResultsChanged) {
						this.props.onResultsChanged(newResults.reduce((allItems,nextResult) => {
							allItems.push(...nextResult.items.toArray())
							return allItems
						},[]))
					}
				})
			
			if (props.allowEmptyQuery)
				provider.setQuery('')
		}
		
		
		let
			searchState = getValue(() => this.state.searchState,{
				items: List<SearchItem>(),
				selectedIndex: 0,
				provider
			})
		
		const
			results:SearchResult[] = getValue(() => this.state.results,[]),
			items = this.getItems(results),
			totalItemCount = items.size,
			selectedIndex = totalItemCount &&
				Math.min(
					searchState.selectedIndex,
					Math.max(0, totalItemCount - 1))
		
		
		
		
		return (assign(newState,{
			provider,
			results,
			items,
			totalItemCount,
			focused,
			searchState: assign({},assign(searchState,{
				results,
				selectedIndex,
				items,
				provider
			}))
		}))
	}


	/**
	 * Calculate a new state based on props
	 * and set it
	 *
	 * @param props
	 * @param focused
	 */
	updateState = (props: ISearchPanelProps = null, focused: boolean = getValue(() => this.state.focused)) => {
		const
			newState = this.getNewState(props, focused)
		
		//if (!shallowEquals(this.state,newState))
		this.setState(newState)
		
		return newState
	}


	/**
	 * Select text in query
	 */
	select() {
		const textField = this.state.textField
		if (!textField) return

		const
			$ = require('jquery'),
			textElement = ReactDOM.findDOMNode(textField),
			inputElement = $('input', textElement)[0]

		if (inputElement) {
			const
				selectStart = _.get(inputElement.selectionStart, 0),
				selectEnd = _.get(inputElement.selectionEnd, 0)

			if (selectStart === selectEnd)
				inputElement.select()
		}
	}


	onFocus = (event) => {
		log.info('Search panel gained focus query = ', this.query)
		this.updateState(this.props,true)
		
		//this.focusTextField()
		// this.updateState(this.props, true)
		// if (this.query.length) {
		// 	this.select()
		// }

	}

	focusTextField = (setFocus = true) => {
		const
			textField = this.state.textField,
			shouldFocus = textField && this.isFocused(this.props)

	}

	/**
	 * Blue handler checks to see if
	 * focus has moved away from the search panel
	 *
	 * @param event
	 */
	onBlur = (event) => {
		log.info('search panel blur')
		
		setTimeout(() =>
			this.mounted && this.setState({focused:false}),1
		)
		
		//this.updateState(this.props,false)
		//this.setState({selected: false, focused: false})

	}

	
	updateSearchResults(query) {
		const
			{provider,searchState} = this.state
		
		provider.setQuery(query)
		
		
	}

	/**
	 * When the search text field changes
	 *
	 * @param event
	 */


	onInputChange(event) {
		const
			query = event.target.value,
			{searchState} = this.state
		log.debug('Search value: ' + query)
		if (!query || !query.length) {
			this.setState({
				query,
				searchState: assign({},assign(searchState,{
					selectedIndex: 0,
					results: [],
					items: List<SearchItem>()
				}))
			})
		} else {
			this.setState({query})
			this.updateSearchResults(query)
		}
		
	}

	/**
	 * Search result is selected
	 *
	 * @param item
	 */
	onResultSelected = (item:SearchItem) => {
		
		item = item || _.get(this, 'state.selectedItem', null)
		
		log.info(`Result selected`,item,this.state)
		
		const
			{provider,searchState} = this.state,
			{items,selectedIndex} = searchState,
			{onResultSelected} = this.props
		
		if (!item) {
			if (items && isNumber(selectedIndex)) {
				item = items.get(selectedIndex)
			}

			if (!item) {
				log.info(`no model item found, can not select`)
				return
			}
		}
		
		provider.select(this.props.searchId, item)
		this.setState({focused: false})
		
		
		log.info(`Calling panel owner`, onResultSelected)
		if (onResultSelected) {
			onResultSelected(item)
		} else {
			const
				$ = require('jquery'),
				inputElement = this.inputElement
			
			if (inputElement)
				inputElement.blur()
		}
		
	
		

	}

	/**
	 * On search item hover
	 *
	 * @param item
	 */
	onHover = (item: SearchItem) => {
		const
			{searchState} = this.state,
			{items,selectedIndex} = searchState,
			index = Math.max(
				items.findIndex(findItem => findItem.id === item.id),
				0
			)

		
		if (selectedIndex !== index)
			this.setSelectedIndex(index)
	}

	/**
	 * Get reference to SearchResultsList
	 *
	 * @returns {SearchResultsList}
	 */
	get resultsList(): SearchResults {
		const listWrapper = this.state.resultsListRef
		return (listWrapper && listWrapper.getWrappedInstance) ?
			listWrapper.getWrappedInstance() as any :
			null
	}

	getSelectedIndexAndItem():[number,SearchItem] {
		return getValue(() => {
			const
				{searchState} = this.state,
				{selectedIndex,items} = searchState
					
			return [selectedIndex,items.get(searchState.selectedIndex)]
		},[0,null]) as any
	}
	
	setSelectedIndex = (selectedIndex) => {
		
		const
			{selectionListeners} = this.state
		
		let
			{searchState,totalItemCount} = this.state,
			endIndex = Math.max(totalItemCount - 1, 0),

			newSelectedIndex = selectedIndex < 0 ? endIndex :
				(selectedIndex > endIndex) ? 0 :
					selectedIndex


		log.debug('state selectedIndex', searchState.selectedIndex, 'param selectedIndex', selectedIndex, 'newSelectedIndex', newSelectedIndex, 'endIndex', endIndex)
		
		
		
		this.setState({
			searchState: assign({},assign(searchState,{
				selectedIndex:newSelectedIndex
			}))
		}, () => selectionListeners.forEach(listener => {
			listener(newSelectedIndex,searchState.items.get(newSelectedIndex) || {})
		}))
		
	}

	moveSelection = (increment: number) => {
		log.info('move selection trigger')
		
		this.setSelectedIndex(getValue(() => this.state.searchState.selectedIndex,0) + increment)
	}

	

	setTextFieldRef = (c) => {
		if (!this.state.textField) {
			this.setState({textField: c})
		}

		//this.focusTextField()
	}
	//
	// onTextFieldBlur = (event) => {
	// 	log.info('text field blur', this, event)
	// 	this.setState({focused: false})
	// 	//this.onBlur({})
	// 	//this.updateState(this.props,false)
	// }
	//
	// onTextFieldFocus = (event) => {
	// 	log.info('text field focused', this, event)
	// 	this.setState({focused: true})
	// 	//this.updateState(this.props,true)
	// 	//this.onFocus({})
	// }


	/**
	 * On mount
	 */
	componentWillMount = () => this.updateState(this.props)

	componentDidMount = () => this.mounted = true
	
	
	componentWillUnmount = () => {
		this.mounted = false
		
		const
			unsubscribe:any = getValue(() => this.state.unsubscribe,null) as any
		
		const
			newState = {
				provider:null,
				searchState: assign({},assign(this.state.searchState,{
					provider: null
				}))
			} as any
			
		if (unsubscribe) {
			unsubscribe()
			newState.unsubscribe = null
		}
		
		this.setState(newState)
	}
	/**
	 * On props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps: ISearchPanelProps) => {
		const
			{searchState} = this.state,
			selectedIndex:number = searchState.selectedIndex,
			selectedItem = isNumber(selectedIndex) && selectedIndex > -1 && searchState.items.get(selectedIndex),
			newState = this.updateState(nextProps)
		
		let
			newSelectedIndex = 0
		
		if (selectedItem) {
				newSelectedIndex = (newState.items || [])
					.findIndex(newItem => newItem.id === selectedItem.id)
		}

		if (isNumber(selectedIndex))
			this.setState({
				searchState: assign(searchState,{
					selectedIndex: newSelectedIndex
				})
			})
	}


	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{
				commandContainer,
				expanded,
				styles,
				inlineResults,
				hint,
				hintStyle,
				underlineFocusStyle,
				underlineStyle,
				autoFocus,
				searchId
			} = this.props,
			{searchState,query} = this.state,
			
			focused = this.isFocused(),
			
			// Focused Styles
			focusedStyle = focused && styles.focused,
		
			panelStyle = makeStyle(
				styles.wrapper,
				expanded && styles.wrapper.expanded,
				focusedStyle,
				this.props.panelStyle
			),
			
			fieldStyle = makeStyle(
				styles.field,
				focusedStyle,
				this.props.fieldStyle
			),
			
			// Input Styles
			inputStyle = makeStyle(
				styles.field.input,
				focusedStyle,
				this.props.inputStyle
			),
			
			searchPanelId = `searchPanel-${searchId}`
		
		
		return <CommandRoot
			component={this}
			style={panelStyle}
      >



			<div tabIndex={-1} style={[styles.field.wrapper,!expanded && Fill]}>
				<TextField
					id={searchPanelId}
					ref={this.setTextFieldRef}
					tabIndex={-1}
					autoFocus={autoFocus}
					underlineStyle={makeStyle(underlineStyle)}
					underlineFocusStyle={focused && underlineFocusStyle}
					onFocus={(event) => {
						
						log.debug(`Received text box focus event`,event,commandContainer)
						getCommandManager().setContainerFocused(this.commandComponentId,commandContainer,true,event)
						//commandContainer && commandContainer.onFocus(event)
					}}
					hintText={<div style={makeStyle(styles.hint,hintStyle)}>{hint}</div>}
					onChange={(e) => this.onInputChange(e)}
					style={fieldStyle}
					inputStyle={inputStyle}
					defaultValue={query || ''}
				/>
				<SearchResults ref={(resultsListRef) => this.setState({resultsListRef})}
				                   anchor={'#' + searchPanelId}
				                   searchState={searchState}
				                   searchPanel={this}
				                   searchId={searchId}
				                   open={focused}
				                   inline={inlineResults}
				                   onResultHover={this.onHover}
				                   onResultSelected={this.onResultSelected}
				                   containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
				/>
			</div>
		

		</CommandRoot>

	}

}
