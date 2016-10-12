/**
 * Created by jglanz on 6/4/16.
 */

// Imports
import {List} from 'immutable'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import {SearchItem} from 'shared/actions/search/SearchState'
import { ThemedStyles } from "shared/themes/ThemeDecorations"
import { SearchResultsList } from "ui/components/search/SearchResultsList"
import { shallowEquals } from "shared/util/ObjectUtil"
import { ISearchState } from "shared/actions/search"
import { SearchPanel } from "ui/components/search"


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
export interface ISearchResultsProps {
	theme?:any
	styles?:any
	anchor?: string | React.ReactElement<any>
	searchId:string
	searchPanel:SearchPanel
	containerStyle?:any
	inline?: boolean
	searchState:ISearchState
	open:boolean
	
	onResultSelected?:(item:SearchItem) => void
	onResultHover?:(item:SearchItem) => void
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
export class SearchResults extends React.Component<ISearchResultsProps,ISearchResultsState> {


	/**
	 * Mount node for search results
	 */
	private node:HTMLElement

	constructor(props,context) {
		super(props,context)
	}

	componentDidMount():void {


		this.node = doc.createElement('div')
		_.assign(this.node.style, this.props.styles.resultsModal)

		body.appendChild(this.node)
		this.renderResults(this.props)
	}

	componentWillReceiveProps(nextProps:ISearchResultsProps, nextContext:any):void {
		const
			shouldUpdate = !shallowEquals(nextProps,this.props) || !shallowEquals(nextProps,this.props,
				'searchState.items',
				'searchState.selectedIndex')
		
		log.debug(`Going to update results`,shouldUpdate,`SearchState`,this.props.searchState)
		
		if (!nextProps.inline && shouldUpdate)
			this.renderResults(nextProps)
	}

	componentWillUnmount():void {
		ReactDOM.unmountComponentAtNode(this.node)
		body.removeChild(this.node)
		// elementClass(body).remove(styleVisible)
	}
	
	//
	// shouldComponentUpdate(nextProps:ISearchResultsProps, nextState:ISearchResultsState, nextContext:any):boolean {
	// 	const
	// 		shouldUpdate = !shallowEquals(nextProps,this.props,
	// 			'theme',
	// 			'styles',
	// 			'searchState',
	// 			'searchState.items',
	// 			'searchState.selectedIndex')
	//
	// 	return (nextProps.inline && shouldUpdate)
	// }
	//
	
	
	private getContainerStyle(anchor,theme) {
		// FUNC TO GET STYLE
		
		const
			rect =  anchor && anchor.getBoundingClientRect(),
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
	
	renderResults(props) {
		const
			{styles,theme,searchState,open,inline,searchPanel} = props,
			{palette} = theme

		
		
		let
			{anchor} = props,
			resultsStyle = makeStyle(styles.results,{
				backgroundColor: palette.alternateBgColor,
				color: palette.alternateTextColor
			})

		log.debug('rendering results inline:',inline,'open',open,'anchor',props.anchor)

		if (!props.inline) {
			anchor = typeof anchor === 'string' ?
				document.querySelector(anchor) :
				props.anchor
			

			const
				containerStyle = open && anchor ? this.getContainerStyle(anchor,theme) : {
					maxHeight: '0px'
				}

			log.debug('rendering results',{anchor,node:this.node,containerStyle})
			resultsStyle = makeStyle(resultsStyle)
			
			const
				resultsElement = <SearchResultsList
					open={this.props.open}
					searchPanel={this.props.searchPanel}
					searchState={searchState}
					className="searchResults"
					style={resultsStyle}/>

			_.assign(this.node.style, containerStyle)
			ReactDOM.render(resultsElement, this.node)
		} else {
			return <SearchResultsList
				open={this.props.open}
				searchPanel={this.props.searchPanel}
				searchState={searchState}
				className="searchResults"
				style={resultsStyle}/>
		}
		//renderSubtreeIntoContainer(this,resultsElement,this.node)
	}

	render() {
		return (this.props.inline) ?
			this.renderResults(this.props) :
			<div></div>
			// React.DOM.noscript()
	}

}
