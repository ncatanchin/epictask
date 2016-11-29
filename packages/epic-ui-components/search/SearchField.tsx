/**
 * Created by jglanz on 6/1/16.
 */
// Imports
import { List } from "immutable"
import filterProps from 'react-valid-props'
import * as KeyMaps from "epic-command-manager"
import { CommandType, CommonKeys } from "epic-command-manager"
import { SearchResults } from "./SearchResults"
import { isNumber, getValue, guard, Dom, unwrapRef, shallowEquals } from "epic-global"
import { PureRender, TextField, RenderToLayer, FlexRowCenter, Popover, FlexRow } from "epic-ui-components/common"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandContainer
} from "epic-command-manager-ui"
import { ThemedStyles } from "epic-styles"
import {
	SearchEvent,
	TOnSearchSelectHandler,
	SearchController
} from "./SearchController"
import { SearchItem } from "epic-models"
import { ViewRoot } from "epic-typedux/state/window/ViewRoot"
import { SearchState } from "epic-ui-components/search"
import { PositionRelative, FillWidth, rem, Transparent, OverflowAuto, makeFlexAlign } from "epic-styles/styles"
import { isNil } from "typeguard"
import baseStyles from './SearchField.styles'
const
	// Key mapping tools
	{ CommonKeys:Keys } = KeyMaps,
	
	// Constants
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * ISearchFieldProps
 */
export interface ISearchFieldProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	commandContainer?:CommandContainer
	
	/**
	 * Plain text search value
	 */
	text?:string
	
	searchOnEmpty?:boolean
	
	/**
	 * Criteria Object - overrides text
	 */
	criteria?:any
	
	/**
	 * Renderer for criteria - required when criteria is provided
	 *
	 * @param criteria
	 */
	criteriaRenderer?:(criteria:any) => React.ReactElement<any>[]
	
	inputStyle?:any
	
	onSearchItemSelected?:TOnSearchSelectHandler
	
	/**
	 * Max numbers per provider
	 */
	perProviderLimit?:number
	
	/**
	 * Identifier for this search panel
	 */
	searchId:string
	
	/**
	 * Search providers
	 */
	providers:Array<ISearchProviderConstructor|ISearchProvider>
	
	focused?:boolean
	resultsHidden?:boolean
	hidden?:boolean
	
	/**
	 * When escape key is pressed while in focus
	 */
	onEscape?:Function
	
	/**
	 * Input text changed
	 *
	 * @param text
	 */
	onTextChanged?:(text:string) => any
	
	onItemsChanged?:(items:List<SearchItem>) => void
	onItemSelected?:(item:SearchItem) => void
	
	viewController?:SearchController
	viewState?:SearchState
}

export type TSearchSelectionListener = (selectedIndex:number, id:any) => any

export interface ISearchFieldState {
	
	totalItemCount?:number
	selected?:boolean
	text?:string
	textField?:any
	textFieldElem?:any
	
	resultsListRef?:any
	resultsLayerRef?:any
	
}


/**
 * SearchField
 *
 * @class SearchField
 * @constructor
 **/
@ViewRoot(SearchController, SearchState)
@CommandComponent()
@ThemedStyles(baseStyles, 'searchField')
@PureRender
export class SearchField extends React.Component<ISearchFieldProps,ISearchFieldState> implements ICommandComponent {
	
	static defaultProps? = {
		inlineResults: false,
		expanded: false,
		modal: false,
		perSourceLimit: 5,
		searchOnEmpty: false,
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
				(cmd, event) => this.moveSelection(1),
				CommonKeys.MoveDown, {
					hidden: true,
					overrideInput: true
				})
			.command(
				CommandType.Container,
				'Move up',
				(cmd, event) => this.moveSelection(-1),
				CommonKeys.MoveUp, {
					hidden: true,
					overrideInput: true
				})
			
			// ESCAPE
			.command(
				CommandType.Container,
				'Close results',
				(cmd, event) => {
					const
						inputElement = this.inputElement as any,
						{ onEscape } = this.props
					
					log.debug('Escape key received', event, onEscape, inputElement)
					
					if (onEscape && onEscape() === true) {
						guard(inputElement.blur)
						
						this.onTextBlur(null)
					}
					
					
				},
				CommonKeys.Escape,
				
				// OPTS
				{
					hidden: true,
					overrideInput: true
				})
			
			// SELECT
			.command(
				CommandType.Container,
				'Select this issue',
				(cmd, event) => {
					event.preventDefault()
					event.stopPropagation()
					this.onResultSelected(null, null)
					
				},
				CommonKeys.Enter, {
					hidden: true,
					overrideInput: true
				})
			
			
			
			.make()
	
	
	get controller() {
		return this.props.viewController
	}
	
	/**
	 * Command container id
	 */
	get commandComponentId():string {
		const
			componentId = `SearchField-${this.props.searchId}`
		log.debug(`Search panel with id = ${componentId}`)
		return componentId
	}
	
	/**
	 * ID of search panel
	 *
	 * @returns {string}
	 */
	get searchFieldId():string {
		return `searchField-${this.props.searchId}`
	}
	
	constructor(props, context) {
		super(props, context)
		
		const
			controller = new SearchController()
		
		if (this.props.searchOnEmpty)
			controller.setQuery(props.criteria, props.text || '')
		
	}
	
	
	/**
	 * Get the textField component
	 * @returns {any}
	 */
	get textField():React.Component<any,any> {
		return getValue(() => unwrapRef(this.state.textField)) as any
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
		const { textFieldElement } = this
		
		
		return (textFieldElement) ? $('input', textFieldElement)[ 0 ] : null
	}
	
	/**
	 * get the current query string
	 *
	 * @returns {string}
	 */
	get query():string {
		return _.get(this.state, 'query',
				_.get(this.props, 'searchData.search.query')) as string || ''
	}
	
	
	/**
	 * Is the input element focused
	 *
	 * @param props
	 */
	isFocused = (props = this.props):boolean => {
		return props.focused ||
			getValue(() => this.props.viewState.focused, false) ||
			getValue(() => props.commandContainer.isFocused())
		// ||
		// props.commandContainer.isFocused()
	}
	
	/**
	 * On click away
	 *
	 * @param event
	 */
	private onClickAway = (event:MouseEvent) => {
		
		const
			elem = ReactDOM.findDOMNode(this),
			isDescendant = Dom.isDescendant(elem, event.target)
		
		log.debug(`Click away`, elem, event.target)
		if (isDescendant)
			return
		
		guard(() => this.props.onEscape())
	}
	
	/**
	 * Results layer
	 *
	 * @param resultsLayerRef
	 */
	private setResultsLayerRef = (resultsLayerRef) => this.setState({ resultsLayerRef })
	
	/**
	 * Set the results ref
	 *
	 * @param resultsListRef
	 */
	private setResultsListRef = (resultsListRef) => this.setState({ resultsListRef })
	
	
	/**
	 * Calculate a new state
	 *
	 * @param props
	 * @param focused
	 */
	private getNewState = (props:ISearchFieldProps, focused:boolean) => {
		
		const
			newState:any = {},
			{ controller } = this
		
		controller.searchId = props.searchId
		controller.allowEmptyQuery = props.searchOnEmpty
		controller.setProviders(props.providers)
		
		
		let
			searchState = controller.getState()
		
		
		log.debug(`New Search State`, searchState)
		return assign(newState, {
			totalItemCount: searchState.items.size
		})
	}
	
	
	/**
	 * Calculate a new state based on props
	 * and set it
	 *
	 * @param props
	 * @param focused
	 */
	updateState = (props:ISearchFieldProps = null, focused:boolean = getValue(() => this.props.viewState.focused)) => {
		const
			criteriaOrTextChanged = !shallowEquals(props, this.props, 'criteria', 'text'),
			newState = this.getNewState(props, focused)
		
		log.debug(`Criteria or text changed`, criteriaOrTextChanged, props, this.props)
		
		this.setState(
			newState,
			() => criteriaOrTextChanged && this.updateSearchResults(props.criteria, props.text || this.state.text)
		)
		
		
		return newState
	}
	
	
	/**
	 * Select text in query
	 */
	select() {
		const
			textField = this.state.textField
		
		if (!textField)
			return
		
		const
			$ = require('jquery'),
			textElement = ReactDOM.findDOMNode(textField),
			inputElement = $('input', textElement)[ 0 ]
		
		if (inputElement) {
			const
				selectStart = _.get(inputElement.selectionStart, 0),
				selectEnd = _.get(inputElement.selectionEnd, 0)
			
			if (selectStart === selectEnd)
				inputElement.select()
		}
	}
	
	/**
	 * Focus the command container after everything settles
	 */
	private containerFocus = _.debounce((event) => {
		guard(() => this.props.commandContainer.onFocus(event, true))
	}, 250)

	private containerBlur = _.debounce((event) => {
		guard(() => this.props.commandContainer.onBlur(event, true))
	}, 150)

	/**
	 * On text field focus
	 *
	 * @param event
	 */
	onTextFocus = (event) => {
		log.debug('Search panel gained focus query = ', this.query)
		
		this.controller.setFocused(true)
		this.updateSearchResults()
		
		event.persist()
		this.containerFocus(event)
	}
	
	
	/**
	 * Blue handler checks to see if
	 * focus has moved away from the search panel
	 *
	 * @param event
	 */
	onTextBlur = (event) => {
		log.debug('search panel blur')
		
		this.controller.setFocused(false)
		//guard(() => this.props.commandContainer.onBlur(event, true))
		// event.persist()
		// this.containerBlur(event)
	}
	
	
	updateSearchResults = (criteria = this.props.criteria, text = this.props.text || this.state.text) =>
		this.controller.setQuery(criteria, text)
	
	
	/**
	 * When the search text field changes
	 *
	 * @param event
	 */
	private onInputChange = (event) => {
		const
			newText = event.target.value,
			{ onTextChanged, viewState:searchState } = this.props
		
		
		log.debug('Search value: ' + newText)
		// SEARCH IS CONTROLLED EXTERNALLY
		if (onTextChanged && getValue(() => onTextChanged(newText),true) === false) {
			log.debug(`Internal update prevented by onTextChanged`)
			return false
		}
		// INTERNAL SEARCH
		else {
			this.setState({
					text: newText
				}, () => this.updateSearchResults(
				this.props.criteria,
					this.props.text || newText)
			)
			
		}
		
	}
	
	
	/**
	 * Search result is selected
	 *
	 * @param event
	 * @param item
	 * @param fromController - sent from controller handler
	 */
	onResultSelected = (event:SearchEvent, item:SearchItem, fromController = false) => {
		
		item = item || _.get(this.state, 'selectedItem', null)
		
		log.info(`Result selected`, item, this.state)
		
		const
			{ onItemSelected, viewState:searchState } = this.props,
			{ controller } = this,
			{ items, selectedIndex } = searchState
		
		
		if (!item) {
			if (items && isNumber(selectedIndex)) {
				item = items.get(selectedIndex)
			}
			
			if (!item) {
				log.info(`no model item found, can not select`)
				return
			}
		}
		
		
		log.info(`Calling panel owner`, onItemSelected)
		if (onItemSelected) {
			onItemSelected(item)
		} else {
			
			// IF THE SELECTION DID NOT COME FROM THE CONTROLLER THEN EMIT IT
			if (!fromController)
				controller.select(item)
			
			const
				inputElement = this.inputElement
			
			if (inputElement)
				inputElement.blur()
		}
		
		
	}
	
	/**
	 * Curried handler for selection from controller
	 * @param event
	 * @param item
	 * @returns {undefined}
	 */
	onResultSelectedFromController = (event, item) => this.onResultSelected(event, item, true)
	
	
	/**
	 * On search item hover
	 *
	 * @param item
	 */
	onHover = (item:SearchItem) => {
		const
			{ viewState:searchState } = this.props,
			{ items, selectedIndex } = searchState,
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
	get resultsList():SearchResults {
		const listWrapper = this.state.resultsListRef
		return (listWrapper && listWrapper.getWrappedInstance) ?
			listWrapper.getWrappedInstance() as any :
			null
	}
	
	/**
	 * et the current selection index
	 *
	 * @param selectedIndex
	 */
	setSelectedIndex = (selectedIndex) => {
		
		const
			{ controller } = this
		
		let
			totalItemCount = this.props.viewState.items.size,
			endIndex = Math.max(totalItemCount - 1, 0),
			
			newSelectedIndex = selectedIndex < 0 ? endIndex :
				(selectedIndex > endIndex) ? 0 :
					selectedIndex
		
		
		controller.setSelectedIndex(newSelectedIndex)
		
		
	}
	
	/**
	 * Move the current selection
	 *
	 * @param increment
	 */
	moveSelection = (increment:number) => {
		log.debug('move selection trigger', increment)
		
		let
			selectedIndex = this.props.viewState.selectedIndex
		
		if (!isNumber(selectedIndex))
			selectedIndex = 0
		
		this.setSelectedIndex(selectedIndex + increment)
	}
	
	
	setTextFieldRef = (c) => {
		//if (!this.state.textField) {
		this.setState({
			textField: c,
			textFieldElem: getValue(() => ReactDOM.findDOMNode(c))
		})
		//}
	}
	
	
	/**
	 * On mount
	 */
	componentWillMount = () => {
		this.controller.on(SearchEvent[ SearchEvent.ItemSelected ], this.onResultSelectedFromController)
		this.updateState(this.props)
	}
	
	/**
	 * Did mount
	 */
	componentDidMount = () => this.mounted = true
	
	
	componentWillUnmount = () => {
		this.controller.removeListener(SearchEvent[ SearchEvent.ItemSelected ], this.onResultSelectedFromController)
		this.mounted = false
		
		
	}
	/**
	 * On props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps:ISearchFieldProps) => {
		log.debug(`new props`, nextProps)
		this.updateState(nextProps)
	}
	
	
	/**
	 * Render the results layer
	 */
	private renderResultsLayer = () =>
		// FOCUSED
		<SearchResults
			ref={this.setResultsListRef}
			anchor={`#${this.searchFieldId}-input`}
			controller={this.controller}
			searchId={this.props.searchId}
			onItemHover={this.onHover}
			onItemSelected={(item) => this.onResultSelected(null,item)}
			containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
		/>
	
	
	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const
			{
				styles,
				placeholder,
				autoFocus,
				criteria,
				criteriaRenderer,
				text,
				searchId,
				viewState: searchState
			} = this.props,
			{ text:stateText } = this.state,
			
			focused = this.isFocused(),
			
			// Focused Styles
			focusedStyle = focused && styles.focused,
			
			panelStyle = makeStyle(
				styles.wrapper,
				focusedStyle
			),
			
			fieldStyle = makeStyle(
				styles.field,
				focusedStyle
			),
			
			// Input Styles
			inputStyle = makeStyle(
				styles.field.input,
				focusedStyle,
				this.props.inputStyle
			),
			
			{ searchFieldId } = this
		
		return <CommandRoot
			id={searchFieldId}
			component={this}
			style={panelStyle}
		>
			
			<div tabIndex={-1} style={[styles.container]}>
				
				<FlexRow align='center'
				         justify='flex-start'
				         style={styles.inputContainer}>
					
					{/* RENDER CRITERIA */}
					{ getValue(() => criteriaRenderer(criteria)) }
					
					<TextField
						{...filterProps(this.props)}
						id={`${searchFieldId}-input`}
						ref={this.setTextFieldRef}
						autoComplete="off"
						tabIndex={-1}
						autoFocus={autoFocus}
						onFocus={this.onTextFocus}
						onBlur={this.onTextBlur}
						placeholder={placeholder}
						onChange={this.onInputChange}
						style={fieldStyle}
						inputStyle={inputStyle}
						value={text || stateText || ''}
					/>
				
				</FlexRow>
				
				
				<Popover
					canAutoPosition={false}
					open={focused}
					anchorOrigin={{
						vertical: 'bottom',
						horizontal: 'left',
					}}
					targetOrigin={{
						vertical: 'top',
						horizontal: 'left',
					}}
				  anchorEl={this.state.textFieldElem}
					useLayerForClickAway={false}
				  >
					{this.renderResultsLayer()}
				</Popover>
				
				{/*<RenderToLayer*/}
					{/*ref={this.setResultsLayerRef}*/}
					{/**/}
					{/*render={this.renderResultsLayer}*/}
					{/*useLayerForClickAway={false}*/}
					{/*componentClickAway={this.onClickAway}*/}
				{/*/>*/}
			
			</div>
		
		
		</CommandRoot>
		
	}
	
}
