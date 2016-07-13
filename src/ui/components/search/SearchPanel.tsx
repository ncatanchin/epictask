/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import {debounce} from 'lodash-decorators'
import * as React from 'react'
import {Paper, TextField, AutoComplete, MenuItem} from 'material-ui'
import {connect} from 'react-redux'
import {List,Map} from 'immutable'
import {SearchKey, AppKey} from 'shared/Constants'
import * as KeyMaps from 'shared/KeyMaps'
import {RepoActionFactory} from 'shared/actions/repo/RepoActionFactory'
import {SearchActionFactory} from 'shared/actions/search/SearchActionFactory'
import {
	SearchResult, SearchState, Search, SearchType, SearchResultData,
	SearchData, SearchItem, SearchItemModel
} from 'shared/actions/search/SearchState'



import {SearchResultsList} from './SearchResultsList'
import {createSearchDataSelector} from 'shared/actions/search/SearchSelectors'
import {PureRender} from 'ui/components/common/PureRender'

// Key mapping tools
const {CommonKeys:Keys} = KeyMaps
const {HotKeys} = require('react-hotkeys')

// Constants
const log = getLogger(__filename)
const styles = require("./SearchPanel.scss")

const repoActions = new RepoActionFactory()
const searchActions = new SearchActionFactory()

/**
 * ISearchPanelProps
 */
export interface ISearchPanelProps extends React.HTMLAttributes {
	searchId:string
	types: SearchType[]
	modal?:boolean
	inlineResults?:boolean
	expanded?:boolean
	searchData?:SearchData
	theme?:any
	hidden?:boolean
	mode:"repos"|"issues"
	onResultSelected?:(result:SearchResult) => void
}

export interface ISearchPanelState {
	focused?:boolean
	selectedIndex?:number
	query?:string
	textField?:any
}

function makeMapStateToProps() {
	const searchDataSelector = createSearchDataSelector()

	return (state:any,props:ISearchPanelProps) => {
		const searchData = searchDataSelector(state,props)

		return {
			theme:      getTheme(),
			searchData
		}
	}


}

/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/
@connect(makeMapStateToProps,null,null,{withRef:true})
@CSSModules(styles)
@PureRender
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> {

	static defaultProps = {
		inlineResults: false,
		expanded:      false,
		modal:false
	}

	constructor(props, context) {
		super(props, context)

		this.state = {selectedIndex: 0}
	}


	isFocused = (props,onFocus=false) => (_.get(this,'state.focused') && !props.modal) ||
		(props.open && props.modal) || (onFocus && !props.modal)

	updateFocus = (onFocus) => this.setState({focused: this.isFocused(this.props,onFocus)}) || this.focusTextField()

	getNewState = (props:ISearchPanelProps) => ({
		focused: this.isFocused(props),
		query: _.get(this,'state.query','')
	})

	componentWillMount = () => this.setState(this.getNewState(this.props))
	componentWillReceiveProps = (nextProps:ISearchPanelProps) => this.setState(this.getNewState(nextProps))

	onFocus = (event) => {
		log.info('Search panel gained focus',this,event)
		this.focusTextField()
		this.updateFocus(true)
		//this.focusTextField()

	}

	focusTextField = () => {
		const textField = this.state.textField,
			shouldFocus = this.props.open && textField

		if (shouldFocus)
		  this.state.textField.focus()
	}

	/**
	 * Blue handler checks to see if
	 * focus has moved away from the search panel
	 *
	 * @param event
	 */
	onBlur = (event) => {
		log.info('search panel blur',this,event)
		const searchPanel = document.getElementById('searchPanel')
		if (event.relatedTarget && !searchPanel.contains(event.relatedTarget)) {
			log.info('Search panel blur')
			this.updateFocus(true)
		} else {
			log.info('Probably text box blur')
		}
	}

	/**
	 * When the search text field changes
	 *
	 * @param event
	 */

	onInputChange(event) {
		const query = event.target.value
		log.info('Search value: ' + query)
		searchActions.setQuery(this.props.searchId,this.props.types,query)
	}

	/**
	 * Search result is selected
	 *
	 * @param result
	 */
	onResultSelected = (result:SearchResult,itemModel:SearchItemModel) => {
		if (!result) {
			const {selectedIndex} = this.state
			const {searchData} = this.props,
				{search,results} = searchData

			// if (results) {
			// 	result = results.find(item => item.index === selectedIndex)
			// 	// for (let r of results) {
			// 	// 	if (r.index === selectedIndex) {
			// 	// 		result = r
			// 	// 		break
			// 	// 	}
			// 	// }
			// }
			//
			// if (!result)
			// 	throw new Error('No result provided and no result matching index: ' + selectedIndex)
		}
		searchActions.select(this.props.searchId,result,itemModel)
		this.setState({focused: false})

		if (this.props.onResultSelected)
			this.props.onResultSelected(result)
	}

	onHover = (result:SearchResult,itemModel:SearchItemModel) => {
		//this.setSelectedIndex(result.index)
	}

	resultsList = () => {
		//return this.refs.resultsList
	}

	setSelectedIndex = (selectedIndex) => {
		const {results} = this.props.searchData
		const endIndex = Math.max(results ? results.size - 1 : 0,0)



		const newSelectedIndex = selectedIndex < 0 ? endIndex :
			(selectedIndex > endIndex) ? 0 :
				selectedIndex


		log.info('selectedIndex',selectedIndex,'newSelectedIndex',newSelectedIndex,'endIndex',endIndex,'results',results)
		this.setState({selectedIndex:newSelectedIndex})
	}

	moveSelection = (increment:number) => {
		const {selectedIndex} = this.state
		this.setSelectedIndex(selectedIndex + increment)
	}

	keyHandlers = {
		[Keys.MoveUp]: () => this.moveSelection(-1),
		[Keys.MoveDown]:() => this.moveSelection(1),
		[Keys.Enter]: () => this.onResultSelected(null,null)

	}

	setTextFieldRef = (c) => {
		if (!this.state.textField) {
			this.setState({textField: c})
		}

		this.focusTextField()
	}

	onTextFieldBlur = (event) => {
		log.info('text field blur',this,event)
	}

	onTextFieldFocus = (event) => {
		log.info('text field focused',this,event)
	}

	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const {expanded, theme,searchId,hidden,modal} = this.props,
			{search,results} = this.props.searchData,
			{query} = search

		const {searchPanel:spTheme} = theme
		const focused = modal || this.state.focused
		const resultsOpen = (results && results.length > 0 ||
			(query && query.length > 0)) &&
			(focused || modal) && !hidden

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
		const inputStyle = Object.assign({}, spTheme.style, focused ? spTheme.focusedStyle : {}, {

		})

		// Focused Styles
		const focusedClazz = focused ? ' ' + styles.focused : ''


		log.info('Rendering with results',results,'focused',focused,'resultsOpen',resultsOpen)

		//<HotKeys handlers={this.keyHandlers} style={expanded ? FillWidth : Fill} onFocus={this.onFocus} onBlur={this.onBlur}>
		return <div  className={panelClazz}  style={Fill} onFocus={this.onFocus}>
				<Paper className={wrapperClazz + focusedClazz}
				       style={makeStyle(panelStyle)}
				       zDepth={2}
				       ref="panel"
				       id="searchPanel">


					<div className={styles.inputWrapper} style={!expanded ? Fill : {}}>
						<TextField
							ref={this.setTextFieldRef}
							autoFocus={this.props.autoFocus}
							tabIndex={1}
							onFocus={this.onTextFieldFocus}
							onBlur={this.onTextFieldBlur}
							hintText={<div style={spTheme.hintStyle}>Search issues, comments, labels &amp; milestones</div>}
							onChange={(e) => this.onInputChange(e)}
							inputStyle={inputStyle}
							defaultValue={this.state.query}
						/>
						<SearchResultsList ref="resultsList"
						                   anchor={'#searchPanel'}
						                   selectedIndex={this.state.selectedIndex}
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

			</div>

	}

}
