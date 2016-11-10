// Imports
import CSSTransitionGroup from 'react-addons-css-transition-group'

import { PureRender } from "epic-ui-components/common"
import { ThemedStyles } from "epic-styles"


import { shallowEquals, getValue } from  "epic-global"
import { SearchResultItem } from "./SearchResultItem"
import { SearchItem, ISearchState, SearchController, SearchEvent } from './SearchController'

// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

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
	controller:SearchController
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
	
	unsubscribe?:Function
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
	
	private get controller() {
		return this.props.controller
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
	componentWillMount() {
		this.updateState()
		
		this.setState({
			unsubscribe: this.controller.on(SearchEvent.StateChanged,() => this.updateState())
		})
	}
	
	componentWillUnmount() {
		const
			unsubscribe = getValue(() => this.state.unsubscribe)
		
		if (unsubscribe) {
			unsubscribe()
			this.setState({
				unsubscribe: null
			})
		}
	}
	
	
	/**
	 * Have items changed
	 *
	 * @param nextProps
	 * @param nextState
	 * @returns {boolean}
	 */
	shouldComponentUpdate(nextProps:ISearchResultsListProps,nextState) {
		return !shallowEquals(
			this.props,
			nextProps,
			'theme',
				'style',
				'styles') || !shallowEquals(
				this.state,
				nextState,
				'results',
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
			{controller} = this,
			searchState = controller.getState(),
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
					                                    controller={controller}
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
			{ theme, styles ,style} = props,
			items = getValue(() => this.state.items)
		
		return !items ? React.DOM.noscript() : <div style={style}>
			<CSSTransitionGroup
				transitionName="results"
				transitionEnterTimeout={250}
				transitionLeaveTimeout={150}>
				
				{items}
			
			</CSSTransitionGroup>
		</div>
	}
	
}