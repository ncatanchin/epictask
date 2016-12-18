// Imports
import * as CSSTransitionGroup from 'react-addons-css-transition-group'

import { WorkIndicator } from "epic-ui-components/common/WorkIndicator"
import { ThemedStyles, IThemedAttributes } from "epic-styles"

import { SearchItem } from 'epic-models'
import { shallowEquals, getValue, guard } from  "epic-global"
import { SearchResultItem } from "./SearchResultItem"
import { SearchController, SearchEvent } from './SearchController'
import { SearchState } from "./SearchState"
import { makeHeightConstraint } from "epic-styles/styles"

// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

function baseStyles(topStyles, theme, palette) {
	const
		{ accent, primary, text, secondary } = palette
	
	return [
		makeTransition([ 'background-color', 'color' ]),
		OverflowAuto,
		PositionRelative,
		{
			maxHeight: '100%',
			backgroundColor: palette.alternateBgColor,
			color: palette.alternateTextColor,
			
			
		}]
}


/**
 * ISearchResultsListProps
 */
export interface ISearchResultsListProps extends IThemedAttributes {
	open?:boolean
	groupByProvider?:boolean
	controller:SearchController
	state:SearchState
	onResultSelected?:(item:SearchItem) => void
	onResultHover?:(item:SearchItem) => void
}

/**
 * ISearchResultsListState
 */
export interface ISearchResultsListState {
}

/**
 * SearchResultsList
 *
 * @class SearchResultsList
 * @constructor
 **/


@ThemedStyles(baseStyles, 'searchResults')
export class SearchResultsList extends React.Component<ISearchResultsListProps,ISearchResultsListState> {
	
	private get controller() {
		return this.props.controller
	}
	
	shouldComponentUpdate(nextProps) {
		return !shallowEquals(this.props,nextProps,'state.items','open')
	}
	
	/**
	 * On click
	 *
	 * @param item
	 *
	 * @returns {(event:any)=>undefined}
	 */
	onClick = (item:SearchItem) => (event) => {
		log.debug(`Clicked for event`, item)
		
		event.preventDefault()
		event.stopPropagation()
		
		guard(() => this.props.onResultSelected(item))
	}
	
	/**
	 * On hover function generator
	 * @param item
	 */
	onHover = (item:SearchItem) => (event) => {
		const
			{ onResultHover } = this.props
		
		log.debug(`Hovering over search item`, item)
		
		onResultHover && onResultHover(item)
	}
	
	
	render() {
		const
			{ props } = this,
			{
				open,
				styles,
				theme,
				groupByProvider,
				state:searchState
			} = props,
			
			items = getValue(() => searchState.items)
		
		// let
		// 	resultsStyle = makeStyle(styles)
		
		return open === false ? null : <div style={styles}>
			
			{/*<CSSTransitionGroup*/}
				{/*transitionName="results"*/}
				{/*transitionEnterTimeout={250}*/}
				{/*transitionLeaveTimeout={150}>*/}
				{/**/}
				{searchState.working &&
					<div style={makeHeightConstraint(theme.search.itemHeight)}>
						<WorkIndicator open={true} />
					</div>
				}
				
				{!items ? React.DOM.noscript() :
					items.map((item, index) => <SearchResultItem
							key={`${item.provider.id}-${item.id}`}
							item={item}
							groupByProvider={groupByProvider}
							controller={this.controller}
							onMouseEnter={this.onHover(item)}
							onClick={this.onClick(item)}
							onMouseDown={this.onClick(item)}
						/>
					)}
				{/*</CSSTransitionGroup>*/}
				
		</div>
		
	}
}