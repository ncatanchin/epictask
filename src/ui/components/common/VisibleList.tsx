// Imports
import * as React from 'react'
import {List} from 'immutable'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { isNumber } from "shared/util"

// Constants
const
	log = getLogger(__filename),
	Resizable = require('react-component-resizable')

const baseStyles = createStyles({
	root: [ FlexColumn,FlexScale, PositionRelative, {
		
	}],
	list: [FlexScale,Fill,PositionRelative,{
		display: 'block',
		overflowY: 'auto',
		overflowX: 'hidden',
		
		content: [FillWidth,PositionRelative,{
			
		}]
	}]
})


export type TItems = Array<any>|List<any>

/**
 * IVisibleListProps
 */
export interface IVisibleListProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	items:TItems
	itemCount:number
	itemHeight?:number
	itemRenderer:(items:any, index:number,style:any,key:any) => React.ReactElement<any>
	initialItemsPerPage?:number
}

/**
 * IVisibleListState
 */
export interface IVisibleListState {
	width?:number
	height?:number
	lastItems?:TItems
	rootElement?:any
	listElement?:any
	itemsPerPage?:number
	startIndex?:number
	endIndex?:number
	scrollTop?:number
	currentItems?:any
	itemCache?:any
}

/**
 * VisibleList
 *
 * @class VisibleList
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@Radium
@PureRender
export class VisibleList extends React.Component<IVisibleListProps,IVisibleListState> {
	
	static defaultProps = {
		initialItemsPerPage: 20
	}
	
	constructor(props,context) {
		super(props,context)
		this.state = {scrollTop: 0}
	}
	
	/**
	 * Recalculate the state,
	 * should be split into 2 different updates,
	 *
	 * 1.  Container Size
	 * 2.  Content/Scroll
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		const
			{state = {}} = this,
			{items} = props,
			{lastItems} = state,
			itemsChanged = lastItems !== items
		
		// Reset the item cache if the src items have changed
		let
			itemCache = (state.itemCache && !itemsChanged) ? state.itemCache : {}
		
		this.setState({
			itemCache,
			lastItems: items
		},this.updateItems)
	}
	
	
	updateItems = () => {
		const
			{state = {},props} = this,
			{itemCount} = props,
			{height,width,rootElement} = state

		if (!height || !width || !rootElement) {
			log.warn(`Height/width not set yet `,height,width,rootElement)
			return
		}

		let
			scrollTop = state.scrollTop || 0,
			itemsPerPage = state.itemsPerPage || props.initialItemsPerPage,
			{itemHeight} = props,
			startIndex = 0,
			endIndex = itemCount

		// If item height is omitted then eventually everything is rendered / simply hidden when not in viewport
		if (itemHeight) {
			itemsPerPage = Math.ceil(height / itemHeight)

			const
				visibleIndex = Math.max(0, Math.floor(scrollTop / itemHeight)) || 0

			startIndex = Math.max(0, visibleIndex - 1)
			endIndex = Math.min(itemCount, visibleIndex + itemsPerPage + 1)
		}
			
		log.info(`Start`,startIndex,'end',endIndex)

		this.setState({
			startIndex,
			endIndex,
			itemsPerPage
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.debounce((event) => {
		const
			{scrollTop} = this.state.listElement,
			{itemHeight} = this.props,
			{height,startIndex,endIndex,scrollTop:currentScrollTop} = this.state

		if (isNumber(currentScrollTop)) {

			if (!height || !itemHeight)
				return

			const
				firstVisibleIndex = Math.max(0, Math.floor(scrollTop / itemHeight)),
				lastVisibleIndex = Math.max(0, Math.ceil((scrollTop + height) / itemHeight))

			if (firstVisibleIndex >= startIndex && lastVisibleIndex <= endIndex) {
				log.info(`Indexes`,firstVisibleIndex,lastVisibleIndex, `within start/end`,startIndex,endIndex)
				return
			}
		}

			this.setState({scrollTop},this.updateItems)

		
	},150)
	
	/**
	 * On resize
	 *
	 * @param width
	 * @param height
	 */
	private onResize = ({width,height}) => {
		log.info(`Container resized ${width}/${height}`)
		this.setState({width,height}, () => this.updateItems())
	}
	
	/**
	 * Ref setter for root element
	 *
	 * @param rootElement
	 */
	private setRootRef = (rootElement) => this.setState({rootElement}, () => this.onResize(rootElement.getDimensions()))
	
	private setListRef = (listElement) => this.setState({listElement},() => this.updateState())
	
	/**
	 * On mount
	 */
	componentWillMount() {
		this.updateState()
	}
	
	/**
	 * When next props are received
	 *
	 * @param nextProps
	 */
	componentWillReceiveProps(nextProps) {
		this.updateState(nextProps)
	}
	
	/**
	 * On render
	 *
	 * @returns {any}
	 */
	render() {
		const
			{props,state = {}} = this,
			{styles,itemRenderer,itemHeight,className} = props,
			items = props.items as any,
			{startIndex,endIndex,itemCache,scrollTop} = state
		
		let
			contentHeight = ((items as any).size || (items as any).length) * itemHeight
		
		return <Resizable style={styles.root}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={[styles.list]} ref={this.setListRef} onScroll={this.onScroll} className={`visible-list ${className || ''}`} data-visible-list="true">
				<div style={[styles.list.content,itemHeight && {
					height: isNaN(contentHeight) ? 0 : contentHeight
				}]}>
					
					{/*{items.map((item,index) => itemRenderer(items, index,{},index))}*/}
					{
						// ITEMS
						
						isNumber(startIndex) && isNumber(scrollTop) && ((itemHeight) ? items
						.slice(startIndex, endIndex)
						.map((item, index) => {
							index += startIndex
							const
								style = makeStyle(FillWidth,{
									position: 'absolute',
									top: (itemHeight * index) || 0,
									height: itemHeight
								}),
								indexId = `${index}`,
								key = indexId
							
							return itemCache[indexId] || (itemCache[indexId] = itemRenderer(items, index,style,key))
							//return itemRenderer(items, index,style,key)
							
						}) : items.map((item, index) => {
						const
							style = makeStyle(FillWidth,{
								position: 'relative'
							}),
							key = index
						return itemCache[index] || (itemCache[index] = itemRenderer(items, index,style,key))
					}))}
				</div>
			</div>
		</Resizable>
	}
	
}