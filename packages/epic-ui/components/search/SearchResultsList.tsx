// Imports
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import * as React from 'react'

import { PureRender } from 'ui/components/common/PureRender'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { SearchItem, ISearchState } from "shared/actions/search"

import { shallowEquals, getValue } from "shared/util"
import { SearchResultItem } from "ui/components/search/SearchResultItem"
import { SearchPanel } from "ui/components/search"

// Constants
const
	log = getLogger(__filename)

//DEBUG
log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles,theme,palette) {
	const
		{ accent, primary, text, secondary } = palette
	
	return {
		
		
		
	}
}


/**
 * ISearchResultsListProps
 */
export interface ISearchResultsListProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	open?:boolean
	searchPanel:SearchPanel
	searchState:ISearchState
	onResultSelected?:(item:SearchItem) => void
	onResultHover?:(item:SearchItem) => void
}

/**
 * ISearchResultsListState
 */
export interface ISearchResultsListState {
	itemCache?:{[id:string]:SearchResultItem}
	items?:SearchResultItem[]
	ids?:number[]
}

/**
 * SearchResultsList
 *
 * @class SearchResultsList
 * @constructor
 **/


@ThemedStyles(baseStyles,'searchResults')
@PureRender
export class SearchResultsList extends React.Component<ISearchResultsListProps,ISearchResultsListState> {
	
	
	constructor(props,context) {
		super(props,context)
		
		this.state = {
			itemCache: {}
		}
	}
	
	/**
	 * Update state - create new items, remove old ones, etc
	 */
	updateState = (props = this.props) => {
		this.updateResults(props)
	}
	
	/**
	 * On mount - update state
	 */
	componentWillMount = this.updateState
	
	
	/**
	 * Have items changed
	 *
	 * @param nextProps
	 * @param nextState
	 * @returns {boolean}
	 */
	searchItemsChanged(nextProps:ISearchResultsListProps,nextState) {
		return !getValue(() => this.state.items) || !shallowEquals(
			this.props,
			nextProps,
			'theme',
				'style',
				'styles',
			'searchState',
			'searchState.items') || !shallowEquals(
				this.state,
				nextState,
				'theme',
				'styles',
				'items')
	}
	/**
	 * On new props - update the state
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps = (nextProps) => this.updateState(nextProps)
	
	
	/**
	 * On click
	 *
	 * @param item
	 *
	 * @returns {(event:any)=>undefined}
	 */
	onClick = (item:SearchItem) => (event) => {
		log.debug(`Clicked for event`,item)
		
		event.preventDefault()
		event.stopPropagation()
		
		const
			{onResultSelected} = this.props,
			isFn = _.isFunction(onResultSelected)
		
		if (isFn) {
			onResultSelected(item)
		}
	}
	
	/**
	 * On hover function generator
	 * @param item
	 */
	onHover = (item:SearchItem) => (event) => {
		const
			{onResultHover} = this.props
		
		log.debug(`Hovering over search item`,item)
		
		onResultHover && onResultHover(item)
	}
	
	
	/**
	 * Generate the result sections
	 *
	 * @returns {any}
	 */
	updateResults(props:ISearchResultsListProps) {
		const
			{styles,onResultHover,onResultSelected,searchPanel,searchState} = props,
			{items: searchItems,selectedIndex} = searchState,
			currentIds = [],
			{ itemCache } = this.state
		
		const
			items:SearchResultItem[] = []
		
		log.debug('updating results from search state',searchState)
		
		if (searchItems) {
			
			log.debug(`Selected index in results ${selectedIndex}`)
			
			
			/**
			 * Iterate results, create items for each
			 */
			searchItems.forEach((searchItem, index) => {
				
				const
					id = `${searchItem.id}`
				
				if (currentIds.includes(id))
					return
				
				currentIds.push(id)
				
				let
					item = itemCache[ id ]
				
				if (!item) {
					item = itemCache[ id ] = <SearchResultItem key={id}
					                                    item={searchItem}
					                                    searchPanel={searchPanel}
					                                    onMouseEnter={this.onHover(searchItem)}
					                                    onClick={this.onClick(searchItem)}
					                                    onMouseDown={this.onClick(searchItem)}
					/> as any
				}
				
				items.push(item)
			})
		}
		
		// REMOVE OLD OBJECTS
		
		Object
			.keys(itemCache)
			.filter(id => !currentIds.includes(id))
			.forEach(id => {
				delete itemCache[id]
			})
		
		const
			ids = getValue(() => this.state.ids)
		
		// IF NO CHANGE - RETURN
		if (
			ids &&
			ids.length === currentIds.length &&
			currentIds.every((id,index) => ids[index] === id)
		)
			return
		
		log.debug(`Settings items`,items,currentIds)
		this.setState({items,ids:currentIds})
		
	}
	
	render() {
		const
			{props,state} = this,
			{ theme, styles ,style} = props
		
		return <div style={style}>
			<CSSTransitionGroup
				transitionName="results"
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>
				
				{getValue(() => this.state.items)}
			
			</CSSTransitionGroup>
		</div>
	}
	
}