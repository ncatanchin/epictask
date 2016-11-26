/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import { ThemedStyles } from "epic-styles"
import { SearchResultsList } from "./SearchResultsList"


import { PureRender } from "epic-ui-components/common/PureRender"
import { SearchEvent, ISearchState, SearchController } from "./SearchController"
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { SearchItem } from "epic-models"
import { makeStyle } from "epic-styles/styles"
import { isString } from "typeguard"


// Constants
const
	log = getLogger(__filename)

//DEBUG
//log.setOverrideLevel(LogLevel.DEBUG)

const
	doc = document,
	{body} = doc

//region Styles
const baseStyles = (topStyles,theme,palette) => {
	const
		{accent,primary,text,secondary} = palette
	
	return {
		content: {
			
		},
		resultsModal: {
			position: 'absolute',
			zIndex: 100
		},
		
		results: [makeTransition(['background-color','color']), {
			overflow: 'hidden',
			maxHeight: "80vh"
		}],
		
		resultsTitle: {
			fontWeight: 900,
			textTransform: 'uppercase',
			padding: `0.2rem 0.8rem`
		},
		
		resultSection: [makeTransition(['background-color','color'], 0.15), {}],
		
		resultSectionTitle: {
			//borderBottom: '0.1rem solid transparent',
			marginBottom: rem(0.2),
			padding: `0.1rem 0.8rem`
		},
		
		
		
		noResults: makeStyle(Ellipsis, {
			fontStyle: 'italic',
			fontSize: rem(0.8),
			opacity: 0.8,
			padding: `0.1rem 1rem`
		}),
		
		padded: {
			padding: '0.2rem 1rem'
		}
	}
}
//endregion


/**
 * ISearchResultsProps
 */
export interface ISearchResultsProps extends IThemedAttributes {
	controller:SearchController
	searchId:string
	
	anchor: string | React.ReactElement<any>
	containerStyle?:any
	
	onItemSelected?:(item:SearchItem) => void
	onItemHover?:(item:SearchItem) => void
	
	state:ISearchState
}

interface ISearchResultsState {
	
}

/**
 * SearchResults
 *
 * @class SearchResults
 * @constructor
 **/

@ThemedStyles(baseStyles)
@PureRender
export class SearchResults extends React.Component<ISearchResultsProps,ISearchResultsState> {

	
	private get controller() {
		return this.props.controller
	}
	
	/**
	 * On search results mounted
	 */
	componentDidMount() {
		this.controller.on(SearchEvent.StateChanged,(eventType,newSearchState:ISearchState) => {
			
			this.setState({
				searchState: newSearchState
			})
		})
		
	}
	
	
	
	
	/**
	 * New props received
	 *
	 * @param nextProps
	 * @param nextContext
	 */
	componentWillReceiveProps(nextProps:ISearchResultsProps, nextContext:any):void {
		log.debug(`new props received`,nextProps)
	}
	
	/**
	 * On unmount cleanup
	 */
	componentWillUnmount():void {
		
	}
	
	
	/**
	 * getContainerStyle
	 *
	 * @param anchor
	 * @param theme
	 */
	private getContainerStyle() {
		let
			{anchor,theme} = this.props
		
		anchor = (typeof anchor === 'string' ?
			document.querySelector(anchor) :
			anchor) as any
		
		if (!anchor || isString(anchor)) {
			log.warn(`Unable to determine anchor`,anchor)
			return null
		}
		
		const
			rect =  anchor && (anchor as any).getBoundingClientRect(),
			top = (rect.height + rect.top),
			winHeight = window.innerHeight,
			maxHeight = winHeight - top - (winHeight * .1),
			maxHeightStr = `${maxHeight - 48}px`,
			
			style = {
				position: 'absolute',
				display: 'block',
				width: rect.width + 'px',
				top: `${top}px`,
				left: rect.left + 'px',
				//height: height + 'px',
				maxHeight: maxHeightStr,
				overflow: 'auto',
				fontFamily: theme.fontFamily,
				fontWidth: theme.fontWeight,
				zIndex: 99999
			}
		
		log.debug(`Container style`,rect,top,winHeight,maxHeight)
		
		return style
	
	}
	
	componentDidUpdate = () => {
		const
			elem = ReactDOM.findDOMNode(this),
			containerStyle = this.getContainerStyle()
		
		if (!elem || !containerStyle) {
			log.warn(`Container can not be styled`,elem,containerStyle,this.props)
			return
		}
		
		$(elem).parent().css(containerStyle)
		
		
	}
	
	componentDidMount = this.componentDidUpdate as any
	
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
			{props,controller} = this,
			{
				styles,
				palette,
				theme,
				onItemHover,
				onItemSelected,
				anchor,
				state:searchState
			} = props
		
		log.debug(`Results render`,searchState)
		
		let
			resultsStyle = makeStyle(
				styles.results,
				{
					backgroundColor: palette.alternateBgColor,
					color: palette.alternateTextColor
				}
			)
		
		log.debug('rendering results anchor',props.anchor)
		
		
		
		resultsStyle = makeStyle(resultsStyle)
		
		
		return <SearchResultsList
				controller={this.controller}
				onResultHover={onItemHover}
				onResultSelected={onItemSelected}
				className="searchResults"
				style={resultsStyle}/>
		
	}

}
