/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import {debounce} from 'lodash-decorators'
import * as React from 'react'
import {Paper, TextField} from 'material-ui'
import {connect} from 'react-redux'
import * as KeyMaps from 'shared/KeyMaps'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {SearchActionFactory} from 'shared/actions/search/SearchActionFactory'
import {SearchResult, SearchType, SearchData, ISearchItemModel} from 'shared/actions/search/SearchState'
import {SearchResultsList} from './SearchResultsList'
import {
	createSearchDataSelector,
	createSearchItemSelector,
	createSearchItemModelsSelector
} from 'shared/actions/search/SearchSelectors'
import {PureRender} from 'ui/components/common/PureRender'
import {HotKeyContext} from 'ui/components/common/HotKeyContext'
import {createStructuredSelector} from 'reselect'
import {Themed, ThemedNoRadium} from 'shared/themes/ThemeManager'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {isNumber} from "shared/util"

const $ = require('jquery')


// Key mapping tools
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)
const styles = require("styles/SearchPanel.scss")

//log.info('read styles as', styles)

const repoActions = new RepoActionFactory()
const searchActions = new SearchActionFactory()


/**
 * ISearchPanelProps
 */
export interface ISearchPanelProps extends React.HTMLAttributes {
	searchId: string
	types: SearchType[]
	modal?: boolean
	inlineResults?: boolean
	expanded?: boolean
	searchData?: SearchData
	searchItemModels?: ISearchItemModel[]
	theme?: any
	focused?: boolean
	hidden?: boolean
	mode: "repos"|"issues"
	onEscape?: () => void
	onResultSelected?: (result: ISearchItemModel) => void
}

export interface ISearchPanelState {
	focused?: boolean
	selectedIndex?: number
	totalItemCount?: number
	selected?: boolean
	query?: string
	textField?: any
	resultsListRef?:any
}

function makeMapStateToProps() {
	const searchDataSelector = createSearchDataSelector(),
		searchItemSelector = createSearchItemSelector(),
		searchItemModelsSelector = createSearchItemModelsSelector()

	return createStructuredSelector({
		searchData: searchDataSelector,
		searchItemModels: searchItemModelsSelector,
		theme: () => getTheme()
	})


}

/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/

@HotKeyContext()
@CSSModules(styles)
@connect(makeMapStateToProps, null, null, {withRef: true})
@PureRender
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> {

	static defaultProps = {
		inlineResults: false,
		expanded: false,
		modal: false
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
	 * Calculate a new state
	 *
	 * @param props
	 * @param focused
	 */
	getNewState = (props: ISearchPanelProps, focused: boolean = null) => (assign({
		totalItemCount: (!props.searchItemModels) ? 0 : props.searchItemModels.length,
		selectedIndex: props.searchItemModels && Math.min(_.get(this, 'state.selectedIndex', 0), Math.max(0, props.searchItemModels.length - 1))
	}, _.isBoolean(focused) ? {focused} : {}))


	/**
	 * Calculate a new state based on props
	 * and set it
	 *
	 * @param props
	 * @param focused
	 */
	updateState = (props: ISearchPanelProps, focused: boolean = null) => {
		this.setState(this.getNewState(props, focused))
	}


	/**
	 * Select text in query
	 */
	select() {
		const textField = this.state.textField
		if (!textField) return

		const $ = require('jquery')
		const textElement = ReactDOM.findDOMNode(textField)
		const inputElement = $('input', textElement)[0]

		if (inputElement) {
			const selectStart = _.get(inputElement.selectionStart, 0),
				selectEnd = _.get(inputElement.selectionEnd, 0)

			if (selectStart === selectEnd)
			// && !_.get(this,'state.selectedText')
			//this.setState({selected:true})
				inputElement.select()

		}


	}


	onFocus = (event) => {
		log.info('Search panel gained focus', this, event, 'query = ', this.query)
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
		log.info('search panel blur', this, event)

		this.updateState(this.props)
		this.setState({selected: false, focused: false})

	}

	@debounce(150)
	updateSearchResults(query) {
		searchActions.setQuery(this.props.searchId, this.props.types, query)
	}

	/**
	 * When the search text field changes
	 *
	 * @param event
	 */


	onInputChange(event) {
		const query = event.target.value
		log.debug('Search value: ' + query)
		this.setState({query})
		this.updateSearchResults(query)
	}

	/**
	 * Search result is selected
	 *
	 * @param itemModel
	 */
	onResultSelected = (itemModel: ISearchItemModel) => {
		
		itemModel = itemModel || _.get(this.resultsList, 'state.selectedItem', null)
		
		if (!itemModel) {
			const {searchItemModels} = this.props,
				{selectedIndex} = this.state || {} as any

			if (searchItemModels && isNumber(selectedIndex)) {
				itemModel = searchItemModels[selectedIndex]
			}

			if (!itemModel) {
				log.info(`no model item found, can not select`)
				return
			}
		}

	
		searchActions.select(this.props.searchId, itemModel)
		this.setState({focused: false})
		
		const {onResultSelected} = this.props
		log.info(`Calling panel owner`, onResultSelected)
		if (onResultSelected) {
			
			onResultSelected(itemModel)
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
	 * @param itemModel
	 */
	onHover = (itemModel: ISearchItemModel) => {
		const itemModels = this.props.searchItemModels || []
		const index = Math.max(
			itemModels.findIndex(findItem => findItem.item.id === itemModel.item.id),
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

	keyHandlers = {
		[Keys.Escape]: (event) => {
			const {onEscape} = this.props
			log.info('Escape key received', event, onEscape)
			onEscape && onEscape()
		},
		[Keys.MoveUp]: () => this.moveSelection(-1),
		[Keys.MoveDown]: () => this.moveSelection(1),
		[Keys.Enter]: () => this.onResultSelected(null)

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

	/**
	 * On props
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps: ISearchPanelProps) => {
		const selectedIndex = _.get(this.state, 'selectedIndex', 0)
		let newSelectedIndex = 0
		if (selectedIndex !== 0) {
			const selectedItem = (this.props.searchItemModels || [])[selectedIndex]
			if (selectedItem) {
				newSelectedIndex = (nextProps.searchItemModels || [])
					.findIndex(newItem => newItem.item.id === selectedItem.item.id)
			}


		}

		this.updateState(nextProps)

		if (selectedIndex)
			this.setState({selectedIndex: newSelectedIndex})
	}


	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const {expanded, theme, searchId, searchItems, hidden, modal} = this.props,
			{searchData}= this.props,
			{search, results} = searchData,
			{query} = search

		const {searchPanel:spTheme} = theme
		const focused = modal || this.isFocused(this.props)
		const resultsOpen = focused

		// Panel styles
		const panelClazz = expanded ?
			styles.searchPanelExpanded :
			styles.searchPanel

		const panelStyle = Object.assign({}, spTheme.wrapperStyle, expanded ? spTheme.wrapperExpandedStyle : {})

		if (focused)
			Object.assign(panelStyle, spTheme.focusedStyle)

		// Wrapper Styles
		const wrapperClazz = expanded ? styles.searchWrapperExpanded :
			styles.searchWrapper

		// Input Styles
		const inputStyle = Object.assign({}, spTheme.style, focused ? spTheme.focusedStyle : {}, {})

		// Focused Styles
		const focusedClazz = focused ? ' ' + styles.focused : ''

		const searchPanelId = `searchPanel-${searchId}`
		//log.info('Rendering with results',{results,props:this.props,state:this.state,resultsOpen})

		//<HotKeys handlers={this.keyHandlers} style={expanded ? FillWidth : Fill} onFocus={this.onFocus} onBlur={this.onBlur}>
		//<div  className={panelClazz}  style={Fill} onFocus={this.onFocus}>
		// {/*onFocus={this.onTextFieldFocus}*/}
		// {/*onBlur={this.onTextFieldBlur}*/}
		return <HotKeys keyMap={KeyMaps.App}
		                handlers={this.keyHandlers}
		                className={panelClazz}
		                style={Fill}
		                onFocus={this.onFocus}
		                onBlur={this.onBlur}>

			<Paper className={wrapperClazz + focusedClazz}
			       style={makeStyle(panelStyle)}
			       zDepth={2}
			       id={searchPanelId}>


				<div className={styles.inputWrapper} style={!expanded ? Fill : {}}>
					<TextField
						ref={this.setTextFieldRef}
						autoFocus={this.props.autoFocus}
						tabIndex={1}
						hintText={<div style={spTheme.hintStyle}>Search issues, comments, labels &amp; milestones</div>}
						onChange={(e) => this.onInputChange(e)}

						inputStyle={inputStyle}
						defaultValue={this.state.query || query}
					/>
					<SearchResultsList ref={(resultsListRef) => this.setState({resultsListRef})}
					                   anchor={'#' + searchPanelId}
					                   selectedIndex={this.state.selectedIndex}
					                   searchItemModels={this.props.searchItemModels || []}
					                   searchId={searchId}
					                   open={resultsOpen}
					                   inline={expanded}
					                   results={results ||  []}
					                   onResultHover={this.onHover}
					                   onResultSelected={this.onResultSelected}
					                   containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
					                   className={styles.results}
					/>
				</div>
			</Paper>

		</HotKeys>

	}

}
