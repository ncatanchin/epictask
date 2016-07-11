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
import {createSearchSelector} from 'shared/actions/search/SearchSelectors'

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
export interface ISearchPanelProps {
	searchId:string
	types: SearchType[]

	inlineResults?:boolean
	expanded?:boolean
	data?:SearchData
	theme?:any
	hidden?:boolean
	mode:"repos"|"issues"
	onResultSelected?:(result:SearchResult) => void
}

export interface ISearchPanelState {
	focused?:boolean
	selectedIndex?:number
	query?:string
}

function makeMapStateToProps() {
	const searchSelector = createSearchSelector()

	return (state:any,props:ISearchPanelProps) => {
		const data = searchSelector(state,props)

		return {
			theme:      getTheme(),
			data
		}
	}


}

/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/
@connect(makeMapStateToProps)
@CSSModules(styles)
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> {

	static defaultProps = {
		inlineResults: false,
		expanded:      false
	}

	constructor(props, context) {
		super(props, context)

		this.state = {selectedIndex: 0, focused: false,query:props.query}
	}



	onFocus = () => {
		log.info('Search panel gained focus')
		this.setState({focused: true})
	}

	/**
	 * Blue handler checks to see if
	 * focus has moved away from the search panel
	 *
	 * @param event
	 */
	onBlur = (event) => {
		const searchPanel = document.getElementById('searchPanel')
		if (event.relatedTarget && !searchPanel.contains(event.relatedTarget)) {
			log.info('Search panel blur')
			this.setState({focused: false})
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
	 * Search text loses focus
	 */
	onInputBlur = () => {

	}

	/**
	 * Search text gains focus
	 */
	onInputFocus = () => {

	}

	/**
	 * Search result is selected
	 *
	 * @param result
	 */
	onResultSelected = (result:SearchResult,itemModel:SearchItemModel) => {
		if (!result) {
			const {selectedIndex} = this.state
			const {data} = this.props,
				{search,results} = data

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
		const {results} = this.props.data
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

	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const {expanded, theme,hidden} = this.props,
			{search,results} = this.props.data,
			{query} = search

		const {searchPanel:spTheme} = theme
		const focused = this.state.focused
		const resultsOpen = (results && results.length > 0 ||
			(query && query.length > 0)) &&
				focused && !hidden

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


		const panel = <Paper className={wrapperClazz + focusedClazz}
		                     style={makeStyle(panelStyle)}
		                     zDepth={2}
		                     ref="panel"
		                     id="searchPanel">


			<div className={styles.inputWrapper} style={!expanded ? Fill : {}}>
				<TextField
					hintText={<div style={spTheme.hintStyle}>Search issues, comments, labels &amp; milestones</div>}
					onChange={(e) => this.onInputChange(e)}
					inputStyle={inputStyle}
					defaultValue={this.state.query}
				/>
				<SearchResultsList ref="resultsList"
				                   anchor={'#searchPanel'}
				                   selectedIndex={this.state.selectedIndex}
				                   open={resultsOpen}
				                   inline={expanded}
				                   results={results}
				                   onResultHover={this.onHover}
				                   onResultSelected={this.onResultSelected}
				                   containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}
				                   className={styles.results}
				/>
			</div>
		</Paper>

		return <HotKeys handlers={this.keyHandlers} style={expanded ? FillWidth : Fill} onFocus={this.onFocus} onBlur={this.onBlur}>
			<div  className={panelClazz}  style={Fill}>
				{panel}

			</div>
		</HotKeys>
	}

}
