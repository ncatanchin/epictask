/**
 * Created by jglanz on 6/1/16.
 */
// Imports
import { List } from "immutable"
import { TextField } from "material-ui"
import * as KeyMaps from "epic-command-manager"
import { CommandType, CommonKeys } from "epic-command-manager"
import { SearchResults } from "./SearchResults"
import { isNumber, getValue } from "epic-global"
import { PureRender } from "epic-ui-components/common"
import {
	CommandComponent,
	ICommandComponent,
	CommandRoot,
	CommandContainerBuilder,
	CommandContainer
} from "epic-command-manager-ui"
import { ThemedStyles } from "epic-styles"
import {
	SearchType,
	SearchItem,
	ISearchState,
	SearchEvent,
	TOnSearchSelectHandler,
	SearchController
} from "./SearchController"

const
	// Key mapping tools
	{ CommonKeys:Keys } = KeyMaps,

	// Constants
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


// STYLES
const baseStyles = (topStyles, theme, palette) => {
	const
		{ primary, accent, text } = palette
	
	
	return [ {
		wrapper: [ PositionRelative, FillWidth, {
			borderRadius: rem(0.2),
			backgroundColor: Transparent,
			
			
			expanded: [ OverflowAuto, PositionAbsolute, {
				left: 0,
				top: '50%',
				width: '70%',
				maxWidth: '70%',
				height: '40%',
				maxHeight: '40%',
				minHeight: '40%'
			} ]
		} ],
		hint: [ {
			backgroundColor: 'transparent',
			color: text.secondary,
			fontWeight: 400
		} ],
		
		field: [ FillWidth, PositionRelative, {
			
			
			wrapper: [ PositionRelative, OverflowAuto, FillWidth, FlexColumn, {
				maxHeight: '100%'
			} ],
			
			input: [ FillWidth, makeTransition([ 'color', 'background-color', 'border', 'padding' ]), {
				backgroundColor: 'transparent',
				color: text.secondary,
				
				
			} ],
		} ],
		
		
		focused: [ {
			backgroundColor: primary.hue4,
			color: text.primary
		} ]
	} ]
}

/**
 * ISearchPanelProps
 */
export interface ISearchPanelProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	commandContainer?:CommandContainer
	
	allowEmptyQuery?:boolean
	perSourceLimit?:number
	
	panelStyle?:any
	inputStyle?:any
	fieldStyle?:any
	underlineStyle?:any
	underlineFocusStyle?:any
	
	onSearchItemSelected?:TOnSearchSelectHandler
	
	
	hint?:any
	hintStyle?:any
	
	resultStyle?:any
	
	
	searchId:string
	types:SearchType[]
	modal?:boolean
	inlineResults?:boolean
	expanded?:boolean
	
	focused?:boolean
	resultsHidden?:boolean
	hidden?:boolean
	mode:"repos"|"issues"|"actions"
	onEscape?:() => any
	onResultsChanged?:(items:List<SearchItem>) => void
	onResultSelected?:(item:SearchItem) => void
}

export type TSearchSelectionListener = (selectedIndex:number, id:any) => any

export interface ISearchPanelState {
	focused?:boolean
	totalItemCount?:number
	selected?:boolean
	query?:string
	textField?:any
	resultsListRef?:any
	
	controller?:SearchController
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
@ThemedStyles(baseStyles, 'searchPanel')
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
						{ onEscape } = this.props
					
					log.info('Escape key received', event, onEscape)
					if (onEscape && onEscape() === true) {
						(this.textField as any).blur()
						this.setState({
							focused: true
						})
					}
					//this.onBlur(event)
					
				},
				CommonKeys.Escape, {
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
					this.onResultSelected(null,null)
					
				},
				CommonKeys.Enter, {
					hidden: true,
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
		
		const
			controller = new SearchController()
		
		if (this.props.allowEmptyQuery)
			controller.setQuery('')
		this.state = {
			controller,
			searchState: controller.getState()
		}
		
	}
	
	
	/**
	 * Get the textField component
	 * @returns {any}
	 */
	get textField():React.Component<any,any> {
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
			getValue(() => this.state.focused, false)
			// ||
			// props.commandContainer.isFocused()
	}
	
	
	/**
	 * Calculate a new state
	 *
	 * @param props
	 * @param focused
	 */
	getNewState = (props:ISearchPanelProps, focused:boolean) => {
		
		const
			newState:any = {},
			{ controller, unsubscribe } = this.state
		
		
		if (!unsubscribe) {
			
			newState.unsubscribe = controller.addListener(
				SearchEvent.StateChanged,
				(eventType, newSearchState) => {
					
					log.debug(`New state received`, newSearchState)
					
					this.setState({
						searchState: newSearchState
					}, () => {
						this.updateState(this.props)
						
						if (this.props.onResultsChanged) {
							this.props.onResultsChanged(newSearchState.items)
						}
					})
					
					
				})
			
			
		}
		
		controller.searchId = props.searchId
		controller.setTypes(...props.types)
		controller.allowEmptyQuery = props.allowEmptyQuery
		
		let
			searchState = controller.getState()
		
		
		log.debug(`New Search State`, searchState)
		return assign(newState, {
			totalItemCount: searchState.items.size,
			searchState
		})
	}
	
	
	/**
	 * Calculate a new state based on props
	 * and set it
	 *
	 * @param props
	 * @param focused
	 */
	updateState = (props:ISearchPanelProps = null, focused:boolean = getValue(() => this.state.focused)) => {
		const
			newState = this.getNewState(props, focused)
		
		//if (!shallowEquals(this.state,newState))
		this.setState(newState, () => this.forceUpdate())
		
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
			inputElement = $('input', textElement)[ 0 ]
		
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
		this.setState({
			focused: true
		})
		// setImmediate(() => this.updateState(this.props,true))
		
		//this.focusTextField()
		//this.updateState(this.props, true)
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
			this.mounted && this.setState({ focused: false }), 1
		)
		
	}
	
	
	updateSearchResults = query => this.state.controller.setQuery(query)
	
	
	/**
	 * When the search text field changes
	 *
	 * @param event
	 */
	
	
	onInputChange(event) {
		const
			query = event.target.value,
			{ searchState } = this.state
		log.debug('Search value: ' + query)
		if (!query || !query.length) {
			this.setState({
				query,
				searchState: assign({}, assign(searchState, {
					selectedIndex: 0,
					results: [],
					items: List<SearchItem>()
				}))
			})
		} else {
			this.setState({ query })
			this.updateSearchResults(query)
		}
		
	}
	
	
	
	/**
	 * Search result is selected
	 *
	 * @param event
	 * @param item
	 * @param fromController - sent from controller handler
	 */
	onResultSelected = (event:SearchEvent,item:SearchItem, fromController = false) => {
		
		item = item || _.get(this.state, 'selectedItem', null)
		
		log.info(`Result selected`, item, this.state)
		
		const
			{ onResultSelected } = this.props,
			{ controller } = this.state,
			searchState = controller.getState(),
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
		
		
		
		log.info(`Calling panel owner`, onResultSelected)
		if (onResultSelected) {
			onResultSelected(item)
		} else {
			
			// IF THE SELECTION DID NOT COME FROM THE CONTROLLER THEN EMIT IT
			if (!fromController)
				controller.select(item)
			
			const
				$ = require('jquery'),
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
	onResultSelectedFromController = (event,item) =>  this.onResultSelected(event,item,true)
	
	
	/**
	 * On search item hover
	 *
	 * @param item
	 */
	onHover = (item:SearchItem) => {
		const
			{ searchState } = this.state,
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
			{ controller } = this.state
		
		let
			totalItemCount = controller.getState().items.size,
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
		log.debug('move selection trigger',increment)
		
		let
			selectedIndex = this.state.controller.getState().selectedIndex
		
		if (!isNumber(selectedIndex))
			selectedIndex = 0
		
		this.setSelectedIndex(selectedIndex + increment)
	}
	
	
	setTextFieldRef = (c) => {
		if (!this.state.textField) {
			this.setState({ textField: c })
		}
	}
	
	
	/**
	 * On mount
	 */
	componentWillMount = () => {
		this.state.controller.on(SearchEvent.ItemSelected,this.onResultSelectedFromController)
		this.updateState(this.props)
	}
	
	/**
	 * Did mount
	 */
	componentDidMount = () => this.mounted = true
	
	
	componentWillUnmount = () => {
		this.state.controller.off(SearchEvent.ItemSelected,this.onResultSelectedFromController)
		this.mounted = false
		
		const
			unsubscribe:any = this.state.unsubscribe,
			newState = {
				searchState: this.state.controller.getState()
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
	componentWillReceiveProps = (nextProps:ISearchPanelProps) => {
		this.updateState(nextProps)
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
			{ searchState, query } = this.state,
			
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
		
		log.debug(`Rendering with search state`, searchState, focused)
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
					underlineFocusStyle={makeStyle(focused && underlineFocusStyle)}
					onFocus={(event) => {
						
						log.debug(`Received text box focus event`,event,commandContainer);
						this.onFocus(event)
						//getCommandManager().setContainerFocused(this.commandComponentId,commandContainer,true,event)
						//commandContainer && commandContainer.onFocus(event)
					}}
					hintText={<div style={makeStyle(styles.hint,hintStyle)}>{hint}</div>}
					onChange={(e) => this.onInputChange(e)}
					style={fieldStyle}
					inputStyle={inputStyle}
					defaultValue={query || ''}
				/>
				{focused && <SearchResults ref={(resultsListRef) => this.setState({resultsListRef})}
				               anchor={'#' + searchPanelId}
				               controller={this.state.controller}
				               searchId={searchId}
				               open={focused}
				               inline={inlineResults}
				               onResultHover={this.onHover}
				               onResultSelected={(item) => this.onResultSelected(null,item)}
				               containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
				/>}
			</div>
		
		
		</CommandRoot>
		
	}
	
}
