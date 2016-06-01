/**
 * Created by jglanz on 6/1/16.
 */

// Imports
import * as React from 'react'
import {AutoComplete,MenuItem} from 'material-ui'
import {connect} from 'react-redux'
import {SearchKey} from '../../shared/Constants'
import {RepoActionFactory} from '../actions/repo/RepoActionFactory'
import {SearchActionFactory} from '../actions/search/SearchActionFactory'
import {SearchResults, SearchResult, SearchResultType} from '../actions/search/SearchState'

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


	}

	handleQueryUpdate = (value) => {
		log.info('Search value: ',value)
		searchActions.setQuery(value)
		// const allRepos = repoActions.state.availableRepos || []
		// const result = allRepos
		// 	.filter(repo => repo.name.toLowerCase().indexOf(value.toLowerCase()) > -1)
		// 	.map(repo => {
		// 		return {
		// 			text: repo.name,
		// 			value: <MenuItem
		// 				      primaryText={repo.name}
		// 				      key={repo}
		// 			      />
		// 		}
		// 	})
		// this.setState({
		// 	dataSource: result
		// })
	}

	handleBlur = () => {

	}

	render() {
		const {searchPanel:spTheme} = getTheme()
		const {expanded} = this.props
		const panelClazz = expanded ? 'search-panel-expanded' : 'search-panel'
		const wrapperClazz = expanded ? 'search-wrapper-expanded' : 'search-wrapper'

		return <div styleName={panelClazz}>
			<div styleName={wrapperClazz} style={spTheme.wrapperStyle}>
				<AutoComplete
					hintText={<div style={spTheme.hintStyle}>Search for a repo or issue</div>}
					dataSource={this.props.dataSource}
					onUpdateInput={this.handleQueryUpdate}
					onBlur={this.handleBlur}
					style={spTheme.style}
				/>
			</div>
		</div>
	}

}