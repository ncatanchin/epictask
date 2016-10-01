/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import {List} from 'immutable'
import * as ReactDOM from 'react-dom'
import * as React from 'react'
import {Paper, TextField} from 'material-ui'
import * as KeyMaps from 'shared/KeyMaps'
import {SearchResult, SearchType} from 'shared/actions/search/SearchState'
import {SearchResultsList} from './SearchResultsList'

import {PureRender} from 'ui/components/common/PureRender'
import {isNumber} from "shared/util/ObjectUtil"
import SearchProvider from "shared/actions/search/SearchProvider"
import {SearchItem} from "shared/actions/search"
import {SearchEvent} from "shared/actions/search/SearchProvider"
import {Themed} from "shared/themes/ThemeManager"
import {
	CommandComponent, ICommandComponent, getCommandProps, CommandRoot,
	CommandContainerBuilder
} from "shared/commands/CommandComponent"
import { ICommand, CommandType } from "shared/commands/Command"
import { CommonKeys } from "shared/KeyMaps"


const $ = require('jquery')

// Key mapping tools
const {CommonKeys:Keys} = KeyMaps

// Constants
const log = getLogger(__filename)
const styles = require("styles/SearchPanel.scss")

/**
 * ISearchPanelProps
 */
export interface ISearchPanelProps extends React.HTMLAttributes<any> {
	searchId: string
	types: SearchType[]
	modal?: boolean
	inlineResults?: boolean
	expanded?: boolean
	theme?: any
	focused?: boolean
	resultsHidden?: boolean
	hidden?: boolean
	mode: "repos"|"issues"
	onEscape?: () => void
	onResultsChanged?: (items: SearchItem[]) => void
	onResultSelected?: (item: SearchItem) => void
}

export interface ISearchPanelState {
	focused?: boolean
	selectedIndex?: number
	totalItemCount?: number
	selected?: boolean
	query?: string
	textField?: any
	resultsListRef?:any
	provider?:SearchProvider
	results?:SearchResult[]
	items?:List<SearchItem>
	unsubscribe?:Function
}


/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/


@CSSModules(styles)
@Themed
@CommandComponent()
@PureRender
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> implements ICommandComponent {

	static defaultProps? = {
		inlineResults: false,
		expanded: false,
		modal: false
	}
	
	
	/**
	 * Commands
	 */
	commands = (builder:CommandContainerBuilder) =>
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
					onEscape && onEscape()
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
		return `SearchPanel-${this.props.searchId}`
	}
	
	constructor(props, context) {
		super(props, context)

		this.state = {selectedIndex: 0}
	}

	
	
	

	/**
	 * Get the textField component
	 * @returns {any}
	 */
	get textField(): React.Component<any,any> {
		return _.get(this, 'state.textField') as any
	}

	/**
	 * Get the underlying text field element
	 *
	 * @returns {E|Element}
	 */
	get textFieldElement() {
		return (this.textField) ? ReactDOM.findDOMNode(this.textField) : null
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
	isFocused = (props): boolean =>
		props.modal === true ||
		_.get(this, 'state.focused', false) as boolean
	
	
	/**
	 * Flatten all items in a result set
	 *
	 * @param results
	 * @returns {SearchItem[]}
	 */
	getItems(results:SearchResult[] = []):List<SearchItem> {
		return results.reduce((items,result) =>
			items.concat(result.items) as List<SearchItem>
		,List<SearchItem>())
	}
	
	/**
	 * Calculate a new state
	 *
	 * @param props
	 * @param focused
	 */
	getNewState = (props: ISearchPanelProps, focused: boolean = null) => {
		
		const newState:any = {}
		
		let provider:SearchProvider = _.get(this,'state.provider') as any
		
		if (!provider) {
			provider = SearchProvider.getInstance(this.props.searchId)
			newState.unsubscribe = provider.addListener(
				SearchEvent.ResultsUpdated,
				(newResults:SearchResult[]) => {
					
					log.info(`New Results received`,newResults)
					
					this.setState({
						results:newResults
					},this.updateState as any)
					
					if (this.props.onResultsChanged) {
						this.props.onResultsChanged(newResults.reduce((allItems,nextResult) => {
							allItems.push(...nextResult.items.toArray())
							return allItems
						},[]))
					}
				})
		}
		
		
		
		
		const
			results:SearchResult[] = _.get(this,'state.results',[]),
			items = this.getItems(results),
			totalItemCount = items.size
		
		
		return (assign(newState,{
			provider,
			results,
			items,
			totalItemCount,
			selectedIndex: totalItemCount &&
				Math.min(
					_.get(this, 'state.selectedIndex', 0),
					Math.max(0, totalItemCount - 1))
		}, _.isBoolean(focused) ? {focused} : {}))
	}


	/**
	 * Calculate a new state based on props
	 * and set it
	 *
	 * @param props
	 * @param focused
	 */
	updateState = (props: ISearchPanelProps = null, focused: boolean = null) => {
		const newState = this.getNewState(props, focused)
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
		//this.focusTextField()
		this.updateState(this.props, true)
		if (this.query.length) {
			this.select()
		}

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

		this.updateState(this.props)
		this.setState({selected: false, focused: false})

	}

	
	updateSearchResults(query) {
		const
			{provider} = this.state
		
		provider.setTypes(...this.props.types)
		provider.setQuery(query)
	}

	/**
	 * When the search text field changes
	 *
	 * @param event
	 */


	onInputChange(event) {
		const
			query = event.target.value
		log.debug('Search value: ' + query)
		this.setState({query})
		this.updateSearchResults(query)
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
			{provider,items,selectedIndex} = this.state,
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
				inputElement = $('input', ReactDOM.findDOMNode(this.state.textField))[0]
			
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
			{items} = this.state,
			index = Math.max(
				items.findIndex(findItem => findItem.id === item.id),
				0
			)

		if (this.state.selectedIndex !== index)
			this.setSelectedIndex(index)
	}

	/**
	 * Get reference to SearchResultsList
	 *
	 * @returns {SearchResultsList}
	 */
	get resultsList(): SearchResultsList {
		const listWrapper = this.state.resultsListRef
		return (listWrapper && listWrapper.getWrappedInstance) ?
			listWrapper.getWrappedInstance() as any :
			null
	}

	setSelectedIndex = (selectedIndex) => {
		const {totalItemCount} = this.state
		const endIndex = Math.max(totalItemCount - 1, 0)

		const newSelectedIndex = selectedIndex < 0 ? endIndex :
			(selectedIndex > endIndex) ? 0 :
				selectedIndex


		log.info('state selectedIndex', this.state.selectedIndex, 'param selectedIndex', selectedIndex, 'newSelectedIndex', newSelectedIndex, 'endIndex', endIndex)
		this.setState({selectedIndex: newSelectedIndex})
	}

	moveSelection = (increment: number) => {
		log.info('move selection trigger')
		const {selectedIndex} = this.state
		this.setSelectedIndex(selectedIndex + increment)
	}

	

	setTextFieldRef = (c) => {
		if (!this.state.textField) {
			this.setState({textField: c})
		}

		this.focusTextField()
	}

	onTextFieldBlur = (event) => {
		log.info('text field blur', this, event)
		this.setState({focused: false})
		//this.onBlur({})
		//this.updateState(this.props,false)
	}

	onTextFieldFocus = (event) => {
		log.info('text field focused', this, event)
		this.setState({focused: true})
		//this.updateState(this.props,true)
		//this.onFocus({})
	}


	/**
	 * On mount
	 */
	componentWillMount = () => this.updateState(this.props)

	
	componentWillUnmount = () => {
		const unsubscribe:any = _.get(this,'state.unsubscribe')
		if (unsubscribe) {
			unsubscribe()
			this.setState({unsubscribe:null})
		}
	}
	/**
	 * On props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps: ISearchPanelProps) => {
		const
			selectedIndex:number = _.get(this.state, 'selectedIndex', 0),
			selectedItem = isNumber(selectedIndex) && selectedIndex > -1 && this.state.items[selectedIndex],
			newState = this.updateState(nextProps)
		
		let newSelectedIndex = 0
		if (selectedItem) {
				newSelectedIndex = (newState.items || [])
					.findIndex(newItem => newItem.id === selectedItem.id)
		}

		if (isNumber(selectedIndex))
			this.setState({selectedIndex: newSelectedIndex})
	}


	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{expanded, theme, autoFocus,searchId, modal} = this.props,
			{items,results,query,selectedIndex} = this.state
		
		
		const
			{searchPanel:spTheme} = theme,
			focused = modal || this.isFocused(this.props),
			resultsOpen = focused,

			// Panel styles
			panelClazz = expanded ?
				styles.searchPanelExpanded :
				styles.searchPanel,
			
			// Wrapper Styles
			wrapperClazz = expanded ? styles.searchWrapperExpanded :
				styles.searchWrapper,
			
			// Focused Styles
			focusedClazz = focused ? ' ' + styles.focused : '',
		
			panelStyle = [
				spTheme.wrapperStyle,
				expanded && spTheme.wrapperExpandedStyle,
				focused && spTheme.focusedStyle
			],
			
			// Input Styles
			inputStyle = [spTheme.style, focused && spTheme.focusedStyle],
			
			searchPanelId = `searchPanel-${searchId}`
		
		//log.info('Rendering with results',{results,props:this.props,state:this.state,resultsOpen})

		//<HotKeys handlers={this.keyHandlers} style={expanded ? FillWidth : Fill} onFocus={this.onFocus} onBlur={this.onBlur}>
		//<div  className={panelClazz}  style={Fill} onFocus={this.onFocus}>
		// {/*onFocus={this.onTextFieldFocus}*/}
		// {/*onBlur={this.onTextFieldBlur}*/}
		return <CommandRoot
			component={this}
			className={panelClazz}
      style={Fill}>

			<Paper className={wrapperClazz + focusedClazz}
			       style={makeStyle(panelStyle)}
			       zDepth={2}
			       id={searchPanelId}>


				<div className={styles.inputWrapper} style={!expanded ? Fill : {}}>
					<TextField
						ref={this.setTextFieldRef}
						tabIndex={-1}
						hintText={<div style={spTheme.hintStyle}>Search issues, comments, labels &amp; milestones</div>}
						onChange={(e) => this.onInputChange(e)}

						inputStyle={inputStyle}
						defaultValue={query || ''}
					/>
					<SearchResultsList ref={(resultsListRef) => this.setState({resultsListRef})}
					                   anchor={'#' + searchPanelId}
					                   selectedIndex={selectedIndex}
					                   searchItems={items}
					                   searchId={searchId}
					                   open={resultsOpen}
					                   inline={expanded}
					                   onResultHover={this.onHover}
					                   onResultSelected={this.onResultSelected}
					                   containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
					                   className={styles.results}
					/>
				</div>
			</Paper>

		</CommandRoot>

	}

}
