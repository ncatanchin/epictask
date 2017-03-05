/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import { SearchResultsList } from "./SearchResultsList"

import { Provider } from "react-redux"
import { SearchEvent, SearchController } from "./SearchController"
import { SearchState } from "./SearchState"
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { SearchItem } from "epic-models"
import { isString, getValue } from "typeguard"
import { shallowEquals } from "epic-global"
import { PureRender } from "epic-ui-components/common"
import { connect } from "react-redux"
import {createStructuredSelector} from 'reselect'
import { makeViewStateSelector } from "epic-typedux/selectors"
import * as ReactDOM from "react-dom"
import * as React from "react"


// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * ISearchResultsProps
 */
export interface ISearchResultsProps extends IThemedAttributes {
	viewController:SearchController
	viewId:string
	
	groupByProvider?:boolean
	searchId:string
	
	anchor:string | React.ReactElement<any>
	containerStyle?:any
	
	onItemSelected?:(item:SearchItem) => void
	onItemHover?:(item:SearchItem) => void
	
	
}


export interface ISearchResultsState {
	rootRef:any
}

/**
 * SearchResults
 *
 * @class SearchResults
 * @constructor
 **/


export class SearchResults extends React.Component<ISearchResultsProps,ISearchResultsState> {
	
	
	private get controller() {
		return this.props.viewController
	}
	
	setRootRef = rootRef => this.setState({rootRef})
	
	
	
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
			maxHeight = winHeight - top - 50, //(winHeight * .1),
			maxHeightStr = `${maxHeight}px`,
			
			elem = ReactDOM.findDOMNode(this),
			height = 'auto', //!elem || !elem.scrollHeight ? maxHeightStr : elem.scrollHeight + 'px',
			
			style = {
				position: 'absolute',
				display: 'block',
				width: rect.width + 'px',
				minWidth: rect.width + 'px',
				top: `${top}px`,
				left: rect.left + 'px',
				
				height: maxHeightStr,
				overflowX: 'hidden',
				overflowY: 'auto',
				fontFamily: theme.fontFamily,
				fontWidth: theme.fontWeight,
				zIndex: 99999
			}
		
		
		log.debug(`Container style`, getValue(() => elem.scrollHeight), rect, top, winHeight, maxHeight,anchor)
		
		return style
		
	}
	
	updateSize = () => {
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
	
	// onSearchStateChanged = () => {
	// 	this.setState({
	// 		searchState: this.controller.getState()
	// 	})
	// }
	//
	/**
	 * New props received
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:ISearchResultsProps, nextContext:any):void {
		log.debug(`new props received`, nextProps)
		if (!shallowEquals(this.props,nextProps))
			this.updateSize()
	}
	
	shouldComponentUpdate(nextProps,nextState) {
		return !shallowEquals(this.state,nextState,'searchState','open','anchor')
	}
	
	
	
	componentDidUpdate = this.updateSize
	
	componentDidMount = this.componentDidUpdate as any
	
	
	
	componentWillMount() {
		//this.onSearchStateChanged()
		//this.props.viewController.on(SearchEvent[ SearchEvent.StateChanged ], this.onSearchStateChanged)
	}
	
	componentWillUnmount() {
		//this.props.viewController.removeListener(SearchEvent[ SearchEvent.StateChanged ], this.onSearchStateChanged)
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
				groupByProvider,
				anchor
			} = props
		
		//log.debug(`Results Container render`, searchState, 'anchor', props.anchor)
		
		
		return <div ref={this.setRootRef}>
			<Provider store={getStore()}>
			<SearchResultsList
			
			viewController={this.controller}
			groupByProvider={groupByProvider}
			onResultHover={onItemHover}
			onResultSelected={onItemSelected}
			className="searchResults"/>
		</Provider>
		</div>
	}
	
}
