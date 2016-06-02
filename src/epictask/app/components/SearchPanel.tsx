/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import * as React from 'react'
import {Paper,TextField,AutoComplete,MenuItem} from 'material-ui'
import {connect} from 'react-redux'
import {SearchKey} from '../../shared/Constants'
import {RepoActionFactory} from '../actions/repo/RepoActionFactory'
import {SearchActionFactory} from '../actions/search/SearchActionFactory'
import {SearchResults, SearchResult, SearchResultType} from '../actions/search/SearchState'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'

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
	dataSource?:any
}

function mapStateToProps(state) {
	const searchState = state.get(SearchKey)
	const {query,results} = searchState
	return {
		query,
		results,
		dataSource: results.all.map((item:SearchResult<any>) => {
			return {
				text: item.value.name,
				value: <MenuItem
					      primaryText={SearchResultType[item.type] + ': ' + item.value.name}
					      key={item}
				      />
			}
		})
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
export class SearchPanel extends React.Component<ISearchPanelProps,any> {

	static getInitialState() {
		return {}
	}

	static defaultProps = {
		inlineResults: false,
		dataSource:[],
		expanded: false
	}

	constructor(props,context) {
		super(props,context)

		this.state = {focused: false}
	}



	handleQueryUpdate = (value) => {
		log.info('Search value: ',value)
		searchActions.setQuery(value)
	}

	handleBlur = () => {
		this.setState({focused: false})
	}

	handleFocus = () => {
		this.setState({focused: true})
	}

	renderResults() {

		return []
	}

	render() {
		const {searchPanel:spTheme} = getTheme()
		const {expanded} = this.props

		const panelClazz = expanded ? styles.searchPanelExpanded :
			styles.seachPanel

		const wrapperClazz = expanded ? styles.searchWrapperExpanded :
			styles.searchWrapper

		const focusedClazz = this.state.focused ? ' ' + styles.focused : ''



		return <div className={panelClazz}>
			<Paper className={wrapperClazz + focusedClazz}
			       style={spTheme.wrapperStyle}
			       zDepth={2}
			>
				<TextField
					hintText={<div style={spTheme.hintStyle}>Search2 for a repo or issue</div>}
				    onChange={this.handleQueryUpdate}
					onBlur={this.handleBlur}
					onFocus={this.handleFocus}
					style={spTheme.style}
				    query={this.props.query}
				    />


				<div className={styles.results}>
					<CSSReactTransitionGroup
						transitionName={styles.results}
						transitionEnterTimeout={250}
						transitionLeaveTimeout={150}>

						{this.renderResults()}

					</CSSReactTransitionGroup>
				</div>
			</Paper>
		</div>
	}

}