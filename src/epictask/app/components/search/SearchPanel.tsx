/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import * as React from 'react'
import {Paper, TextField, AutoComplete, MenuItem} from 'material-ui'
import {connect} from 'react-redux'
import {SearchKey, AppKey} from 'shared/Constants'
import {RepoActionFactory} from 'app/actions/repo/RepoActionFactory'
import {SearchActionFactory} from 'app/actions/search/SearchActionFactory'
import {SearchResults, SearchResult, SearchResultType} from 'app/actions/search/SearchState'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import {makeStyle,rem,FlexRowCenter,FlexColumn,FlexColumnCenter,FlexAlignEnd,FlexScale,Fill,makeTransition} from 'app/themes'
import {SearchResultsList} from './SearchResultsList'
import {isIssue} from 'shared/GitHubModels'
import * as KeyMaps from 'shared/KeyMaps'

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
	inlineResults?:boolean,
	expanded?:boolean,
	results?:SearchResults,
	query?:string
	theme?:any
}

export interface ISearchPanelState {
	focused?:boolean
	selectedIndex?:number
}

function mapStateToProps(state) {
	const searchState = state.get(SearchKey)
	const {query, results} = searchState
	return {
		theme:      getTheme(),
        query,
        results
		
	}
}

/**
 * SearchPanel
 *
 * @class SearchPanel
 * @constructor
 **/
@connect(mapStateToProps)
@CSSModules(styles)
export class SearchPanel extends React.Component<ISearchPanelProps,ISearchPanelState> {



	static defaultProps = {
		inlineResults: false,
		expanded:      false
	}

	constructor(props, context) {
		super(props, context)

		this.state = {selectedIndex: 0, focused: false}
	}



	onFocus = () => {
		log.info('Search panel gained focus')
		this.setState({focused: true})
	}

	onBlur = () => {
		log.info('Search panel blur')
		this.setState({focused: false})
	}

	/**
	 * When the search text field changes
	 *
	 * @param event
	 */
	onInputChange = (event) => {
		const query = event.target.value
		log.info('Search value: ' + query)
		searchActions.setQuery(query)
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
	onSelect = (result:SearchResult<any> = null) => {
		if (!result) {
			const {selectedIndex} = this.state
			const {results} = this.props
			if (results) {
				for (let r of results.all) {
					if (r.index === selectedIndex) {
						result = r
						break
					}
				}
			}

			if (!result)
				throw new Error('No result provided and no result matching index: ' + selectedIndex)
		}
		searchActions.select(result)
	}

	onHover = (result:SearchResult<any>) => {
		this.setSelectedIndex(result.index)
	}

	resultsList = () => {
		//return this.refs.resultsList
	}

	setSelectedIndex = (selectedIndex) => {
		const {results} = this.props
		const endIndex = results ? results.all.length - 1 : 0


		selectedIndex = selectedIndex < 0 ? endIndex :
			(selectedIndex > endIndex) ? 0 :
				selectedIndex

		this.setState({selectedIndex})
	}

	moveSelection = (increment:number) => {
		const {selectedIndex} = this.state
		this.setSelectedIndex(selectedIndex + increment)
	}

	keyHandlers = {
		[Keys.MoveUp]: () => this.moveSelection(-1),
		[Keys.MoveDown]:() => this.moveSelection(1),
		[Keys.Enter]: () => this.onSelect()

	}

	/**
	 * Render the component
	 *
	 * @returns {any}
	 */
	render() {
		const {expanded, theme, query} = this.props
		const {searchPanel:spTheme} = theme
		const focused = this.state.focused
		const resultsOpen = (query && query.length > 0) && focused

		const panelClazz = expanded ? styles.searchPanelExpanded :
			styles.searchPanel

		const panelStyle = Object.assign({}, spTheme.wrapperStyle, expanded ? spTheme.wrapperExpandedStyle : {})
		if (focused)
			Object.assign(panelStyle, spTheme.focusedStyle)

		const wrapperClazz = expanded ? styles.searchWrapperExpanded :
			styles.searchWrapper

		const inputStyle = Object.assign({}, spTheme.style, focused ? spTheme.focusedStyle : {})
		const focusedClazz = focused ? ' ' + styles.focused : ''


		const panel = <Paper className={wrapperClazz + focusedClazz}
		                     style={makeStyle(panelStyle,Fill)}
		                     zDepth={2}
		                     ref="panel">


			<div id="searchPanel" className={styles.inputWrapper} style={Fill}>
				<TextField
					hintText={<div style={spTheme.hintStyle}>Search2 for a repo or issue</div>}
					onChange={this.onInputChange}
					onBlur={this.onInputBlur}
					onFocus={this.onInputFocus}
					inputStyle={inputStyle}
					defaultValue={this.props.query}
				/>
			</div>
		</Paper>


		return <HotKeys handlers={this.keyHandlers} style={Fill}>
			<div onFocus={this.onFocus} onBlur={this.onBlur} className={panelClazz}  style={Fill}>
				{panel}
				<SearchResultsList ref="resultsList"
				                   anchor={'#searchPanel'}
				                   results={this.props.results}
				                   selectedIndex={this.state.selectedIndex}
				                   open={resultsOpen}
				                   onResultHover={this.onHover}
				                   onResultSelected={this.onSelect}
				                   containerStyle={{borderRadius: '0 0 0.4rem 0.4rem'}}/>
			</div>
		</HotKeys>
	}

}