// Imports
import {List} from 'immutable'
import CSSTransitionGroup from 'react-addons-css-transition-group'
import { createThemedStyles, getTheme } from "epic-styles"
import { isNumber, isNil, isFunction } from  "epic-global"
import {shallowEquals} from "epic-global"



// Constants
const
	log = getLogger(__filename),
	Resizable = require('react-component-resizable')


// FOR DEBUG INFO
//log.setOverrideLevel(LogLevel.DEBUG)

const baseStyles = (topStyles,theme,palette) => ({
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

export type TItemHeightFn = (items:TItems,item:any,index:number) => number

/**
 * IVisibleListProps
 */
export interface IVisibleListProps extends React.HTMLAttributes<any> {
	
	items:TItems
	itemKeyProperty?:string
	itemKeyFn?:(items:TItems, item, index:number) => string
	itemCount:number
	itemHeight?:number|TItemHeightFn
	itemRenderer:(items:any, index:number,style:any,key:any) => React.ReactElement<any>
	initialItemsPerPage?:number
	transitionProps?:any
}

/**
 * IVisibleListState
 */
export interface IVisibleListState {
	theme?:any
	styles?:any
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
	itemHeights?:List<number>
	itemHeightMin?:number
	itemHeightTotal?:number
	itemOffsets?:List<number>
	
}

/**
 * VisibleList
 *
 * @class VisibleList
 * @constructor
 **/


// If you have a specific theme key you want to
// merge provide it as the second param

@Radium
export class VisibleList extends React.Component<IVisibleListProps,IVisibleListState> {
	
	static defaultProps = {
		initialItemsPerPage: 20
	}
	
	constructor(props,context) {
		super(props,context)
		this.state = {scrollTop: 0}
	}
	
	private getItemHeight = (items,item,index) => {
		const
			{itemHeight} = this.props
		
		return isFunction(itemHeight) ?
			itemHeight(items,item,index) :
			itemHeight
	}
	
	private getItemHeights(items) {
		const heights =
			items.map((item,index) => this.getItemHeight(items,item,index))
		
		return Array.isArray(heights) ? List<number>(heights) : heights
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
			{items,itemHeight} = props,
			itemsChanged = items !== this.props.items
		
		log.debug(`ITEMS CHANGED changed`,itemsChanged)
		
			
		
		// ITEM HEIGHTS
		const
			heightState = {} as any
		
		let
			itemCache = state.itemCache || {}
		
		if (itemsChanged && !this.hasKeyMapping)
			itemCache = {}
		
		if (itemHeight && (itemsChanged || !state.itemOffsets || !state.itemHeightTotal)) {
			// Reset the item cache if the src items have changed
			
			let
				itemHeights = this.getItemHeights(items),
				itemHeightMin = -1,
				itemHeightTotal = 0,
				itemOffsets = Array(itemHeights.size)
				
			itemHeights.forEach((nextHeight, index) => {
				if (nextHeight > -1 && (itemHeightMin === -1 || nextHeight < itemHeightMin))
					itemHeightMin = nextHeight
				
				itemOffsets[index] = itemHeightTotal
				itemHeightTotal += nextHeight
			})
			
			assign(heightState,{
				itemOffsets: List<number>(itemOffsets),
				itemHeightMin,
				itemHeightTotal,
				itemHeights,
				startIndex: 0,
				endIndex: 0
			})
		}
			
		this.setState(assign({
			styles: createThemedStyles(baseStyles,[]),
			theme: getTheme(),
			itemCache
		},heightState),() => this.updateItems(props))
	}
	
	
	updateItems = (props = this.props) => {
		const
			{state = {}} = this,
			{itemCount,itemHeight,itemRenderer} = props,
			items = props.items as any,
			{height,width,rootElement,itemOffsets,itemCache,itemHeights,itemHeightMin} = state

		if (!height || !width || !rootElement) {
			log.debug(`Height/width not set yet `,height,width,rootElement)
			return
		}

		let
			scrollTop = state.scrollTop || 0,
			itemsPerPage = state.itemsPerPage || props.initialItemsPerPage,
			startIndex = 0,
			endIndex = itemCount

		// If item height is omitted then eventually everything is rendered / simply hidden when not in viewport
		if (itemHeight && itemHeightMin > 0) {
			itemsPerPage = Math.ceil(height / itemHeightMin)

			const
				visibleIndex = Math.max(0, itemOffsets.findIndex(offset => offset + itemHeightMin >= scrollTop) || 0)

			startIndex = Math.max(0, visibleIndex - itemsPerPage)
			endIndex = Math.min(itemCount, visibleIndex + itemsPerPage + itemsPerPage)
		}
			
		log.debug(`Start`,startIndex,'end',endIndex)
		
		
		const
			currentItems = (isNumber(startIndex) && isNumber(scrollTop)) && (itemHeight ? items
				.slice(startIndex, endIndex)
				.map((item, index) => {
					index += startIndex
					
					const
						offset = itemOffsets.get(index),
						style = makeStyle(FillWidth,{
							position: 'absolute',
							top: !offset || isNaN(offset) ? 0 : offset,
							height: itemHeights.get(index)
						}),
						indexId = `${index}`,
						key = this.getItemKey(items,index)
					
					
					return this.getItemComponent(itemCache,itemRenderer,items,item,key,index,style)
					
					//return itemRenderer(items, index,style,key)
					
				}) : items.map((item, index) => {
				const
					style = makeStyle(FillWidth,{
						position: 'relative'
					}),
					indexId = `${index}`,
					key = this.getItemKey(items,index)
				
				return this.getItemComponent(itemCache,itemRenderer,items,item,key,index,style)
				//return itemCache[item] || (itemCache[item] = itemRenderer(items, index,style,key))
				//return itemRenderer(items, index,style,key)
			}))
		
		this.setState({
			startIndex,
			endIndex,
			itemsPerPage,
			currentItems: currentItems || []
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.throttle((event) => {
		const
			{scrollTop} = this.state.listElement,
			{itemHeightMin,height,startIndex,endIndex,scrollTop:currentScrollTop} = this.state

		if (isNumber(currentScrollTop)) {

			if (!height || !itemHeightMin)
				return

			const
				firstVisibleIndex = Math.max(0, Math.floor(scrollTop / itemHeightMin)),
				lastVisibleIndex = Math.max(0, Math.ceil((scrollTop + height) / itemHeightMin))

			if (firstVisibleIndex >= startIndex && lastVisibleIndex <= endIndex) {
				log.debug(`Indexes`,firstVisibleIndex,lastVisibleIndex, `within start/end`,startIndex,endIndex)
				return
			}
		}

		this.setState({scrollTop},this.updateItems)

		
	},250)
	
	
	shouldComponentUpdate(nextProps:IVisibleListProps, nextState:IVisibleListState, nextContext:any):boolean {
		return !shallowEquals(this.state,nextState,'currentItems','startIndex','endIndex','height','scrollTop')
	}
	
	/**
	 * On resize
	 *
	 * @param width
	 * @param height
	 */
	private onResize = ({width,height}) => {
		log.debug(`Container resized ${width}/${height}`)
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
	
	
	private get hasKeyMapping() {
		return this.props.itemKeyProperty || this.props.itemKeyFn
	}
	
	/**
	 * Extract an item key from an item
	 *
	 * @param items
	 * @param index
	 * @returns {number|string}
	 */
	getItemKey(items:TItems,index:number) {
		const
			{itemKeyProperty,itemKeyFn} = this.props,
			item = !items ? null : Array.isArray(items) ? items[index] : items.get(index)
		
		const itemId =
			itemKeyProperty ?
				_.get(item,itemKeyProperty,index) :
				itemKeyFn ?
					itemKeyFn(items,item,index) :
					index
		
		return isNil(itemId) ? index : itemId
	}
	
	/**
	 * Get item component from cache
	 *
	 * @param itemCache
	 * @param itemRenderer
	 * @param items
	 * @param item
	 * @param key
	 * @param index
	 * @param style
	 * @returns {any}
	 */
	private getItemComponent(itemCache,itemRenderer,items,item,key,index,style) {
		let
			itemReg = itemCache[key]
		
		if (!itemReg) {
			const
				renderedComponent = itemRenderer(items, index,{},key)
			itemReg = itemCache[key] = {
				style,
				renderedComponent: renderedComponent,
				component: <div key={key} style={style}>{renderedComponent}</div>
			}
		} else if (!_.isEqual(itemReg.style,style)) {
			Object.assign(itemReg.style,style)
			// Object.assign(itemReg,{
			// 	style,
			// 	component: <div key={key} style={style}>{itemReg.renderedComponent}</div>
			// })
		}
		
		return itemReg.component
	}
	
	/**
	 * On render
	 *
	 * @returns {any}
	 */
	render() {
		const
			{props,state = {}} = this,
			{itemHeight,className,transitionProps} = props,
			{currentItems,itemHeightTotal,styles} = state
			
			
		
		// let
		// 	contentHeight = itemHeightTotal//((items as any).size || (items as any).length) * itemHeightMin
		
		return <Resizable style={styles.root}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={[styles.list]} ref={this.setListRef} onScroll={this.onScroll} className={`visible-list ${className || ''}`} data-visible-list="true">
				
				{/* SCROLL ITEMS CONTAINER - total item height */}
				<div style={[styles.list.content,itemHeight && {height:isNaN(itemHeightTotal) ? 0 : itemHeightTotal}]}>
					{transitionProps && transitionProps.transitionName ?
						<CSSTransitionGroup {...transitionProps}>
							
							{currentItems}
						</CSSTransitionGroup> :
						
						currentItems
					}
				</div>
			</div>
		</Resizable>
	}
	
}