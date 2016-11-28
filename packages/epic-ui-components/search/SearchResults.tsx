/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import { SearchResultsList } from "./SearchResultsList"


import { SearchEvent, SearchController } from "./SearchController"
import { SearchState } from "./SearchState"
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { SearchItem } from "epic-models"
import { isString, getValue } from "typeguard"


// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * ISearchResultsProps
 */
export interface ISearchResultsProps extends IThemedAttributes {
	controller:SearchController
	
	searchId:string
	
	anchor:string | React.ReactElement<any>
	containerStyle?:any
	
	onItemSelected?:(item:SearchItem) => void
	onItemHover?:(item:SearchItem) => void
	
	
}


export interface ISearchResultsState {
	searchState:SearchState
}

/**
 * SearchResults
 *
 * @class SearchResults
 * @constructor
 **/

export class SearchResults extends React.Component<ISearchResultsProps,ISearchResultsState> {
	
	
	private get controller() {
		return this.props.controller
	}
	
	onSearchStateChanged = () => {
		this.setState({
			searchState: this.controller.getState()
		})
	}
	
	/**
	 * New props received
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:ISearchResultsProps, nextContext:any):void {
		log.debug(`new props received`, nextProps)
	}
	
	
	/**
	 * getContainerStyle
	 *
	 */
	private getContainerStyle() {
		let
			{ anchor} = this.props,
			theme = getTheme()
		
		anchor = (typeof anchor === 'string' ?
			document.querySelector(anchor) :
			anchor) as any
		
		if (!anchor || isString(anchor)) {
			DEBUG && log.warn(`Unable to determine anchor`, anchor)
			return null
		}
		
		const
			rect = anchor && (anchor as any).getBoundingClientRect(),
			top = (rect.height + rect.top),
			winHeight = window.innerHeight,
			maxHeight = winHeight - top - (winHeight * .1),
			maxHeightStr = `${maxHeight - 48}px`,
			
			elem = ReactDOM.findDOMNode(this),
			height = !elem || !elem.scrollHeight ? maxHeightStr : elem.scrollHeight + 'px',
			
			style = {
				position: 'absolute',
				display: 'block',
				width: rect.width + 'px',
				top: `${top}px`,
				left: rect.left + 'px',
				height,
				maxHeight: maxHeightStr,
				overflow: 'auto',
				fontFamily: theme.fontFamily,
				fontWidth: theme.fontWeight,
				zIndex: 99999
			}
		
		
		log.debug(`Container style`, getValue(() => elem.scrollHeight), rect, top, winHeight, maxHeight)
		
		return style
		
	}
	
	componentDidUpdate = () => {
		const
			elem = ReactDOM.findDOMNode(this),
			containerStyle = this.getContainerStyle()
		
		//log.debug(`Component did update`, elem, containerStyle)
		
		if (!elem || !containerStyle) {
			DEBUG && log.warn(`Container can not be styled`, elem, containerStyle, this.props,this.controller.getState())
			return
		}
		
		$(elem).parent().css(containerStyle)
		
		
	}
	
	componentDidMount = this.componentDidUpdate as any
	
	
	componentWillMount() {
		this.onSearchStateChanged()
		this.props.controller.on(SearchEvent[ SearchEvent.StateChanged ], this.onSearchStateChanged)
	}
	
	componentWillUnmount() {
		this.props.controller.removeListener(SearchEvent[ SearchEvent.StateChanged ], this.onSearchStateChanged)
	}
	
	/**
	 * Render results list
	 *
	 * @param props
	 * @returns {any}
	 */
	renderResults(props) {
		
	}
	
	/**
	 * Render results when inline
	 */
	render() {
		let
			{ props, state, controller } = this,
			{
				onItemHover,
				onItemSelected,
				anchor
			} = props,
			{ searchState } = state
		
		log.debug(`Results Container render`, searchState, 'anchor', props.anchor)
		
		
		return <SearchResultsList
			open={searchState.focused}
			controller={this.controller}
			state={searchState}
			onResultHover={onItemHover}
			onResultSelected={onItemSelected}
			className="searchResults"/>
		
	}
	
}
