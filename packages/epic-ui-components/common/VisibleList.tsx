// Imports
import {List,Map,Iterable} from 'immutable'
import * as CSSTransitionGroup from 'react-addons-css-transition-group'
import { createThemedStyles, getTheme } from "epic-styles"
import { isNumber, isNil, isFunction } from  "epic-global"
import {shallowEquals,uuid} from "epic-global"
import { getValue, isList } from "typeguard"
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { makeHeightConstraint } from "epic-styles/styles/CommonRules"




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



export type TItems<T> = List<T>

export type TItemHeightFn<T> = (items:TItems<T>,item:T,index:number) => number

export interface IRowTypeConfig<RowType,ItemKeyType,ItemType> {
	clazz: IVisibleListRowComponentConstructor<RowType,ItemKeyType,ItemType>
	props?: any
}


export interface IRowState<RowType,ItemKeyType,ItemType> {
	type:RowType
	item:ItemType
	items:TItems<ItemType>
	key:ItemKeyType
	index:number
	style:any
	config: IRowTypeConfig<RowType,ItemKeyType,ItemType>
}

type TRowStateListener = (outRowState:IRowState<any,any,any>) => any

// class RowState<RowType,ItemKeyType,ItemType> implements IRowState<RowType,ItemKeyType,ItemType> {
//
// 	type:RowType
// 	item:ItemType
// 	items:TItems<ItemType>
// 	key:ItemKeyType
// 	index:number
// 	style:any
// 	available:boolean
// 	component?:VisibleListRowWrapper
// 	config: IRowTypeConfig<RowType,ItemKeyType,ItemType>
//
// 	constructor() {
// 		super()
//
// 	}
//
// 	update(newState) {
// 		assign(this,newState)
// 	}
//
// }
//



export interface IVisibleListRowComponentConstructor<RowType,ItemKeyType,ItemType> {
	new (
		props?:TVisibleListRowComponentProps<RowType,ItemKeyType,ItemType>,
		context?:any):IVisibleListRowComponent<RowType,ItemKeyType,ItemType>
}


export interface IVisibleListRowComponentProps<RowType,ItemKeyType,ItemType> extends IThemedAttributes {
	rowState:IRowState<RowType,ItemKeyType,ItemType>
}

export type TVisibleListRowComponentProps<RowType,ItemKeyType,ItemType> = IVisibleListRowComponentProps<RowType,ItemKeyType,ItemType> & any


/**
 * Builders must produce this interface
 */
export interface IVisibleListRowComponent<RowType,ItemKeyType,ItemType>
extends React.Component<TVisibleListRowComponentProps<RowType,ItemKeyType,ItemType>,any> {
	
	// setRowState:(rowState:IRowState<RowType,ItemKeyType,ItemType>) => void
	//
	// getRowState:() => IRowState<RowType,ItemKeyType,ItemType>
}





/**
 * IVisibleListProps
 */
export interface IVisibleListProps<RowType extends any,ItemKeyType extends any,ItemType extends any> extends React.HTMLAttributes<any> {
	
	items:TItems<ItemType>
	itemKeyProperty?:string
	itemKeyFn?:(items:TItems<ItemType>, item:ItemType, index:number) => ItemKeyType
	itemCount:number
	itemHeight?:number|TItemHeightFn<ItemType>
	rowTypeProvider?:(items:TItems<ItemType>,index:number,key:ItemKeyType) => RowType
	itemBuilder:(indexItemType:RowType) => IRowTypeConfig<RowType,ItemKeyType,ItemType>
	initialItemsPerPage?:number
	transitionProps?:any
}

export type TRowComponents<RowType extends any,ItemKeyType extends any,ItemType extends any> = Map<RowType,List<IRowState<RowType,ItemKeyType,ItemType>>>

/**
 * IVisibleListState
 */
export interface IVisibleListState<RowType extends any,ItemKeyType extends any,ItemType extends any> {
	theme?:any
	styles?:any
	width?:number
	height?:number
	
	rowTypeComponents?:TRowComponents<RowType,ItemKeyType,ItemType>
	rowComponents?:List<IVisibleListRowComponent<RowType,ItemKeyType,ItemType>>
	rowStates?:List<IRowState<RowType,ItemKeyType,ItemType>>
	lastItems?:TItems<ItemType>
	rootElement?:any
	listElement?:any
	itemsPerPage?:number
	
	
	rowTypeConfigs?:any
	
	scrollTop?:number
	currentItems?:any
	itemCache?:any
	itemHeights?:List<number>
	itemHeightMin?:number
	itemHeightTotal?:number
	itemOffsets?:List<number>
	
	bufferStartIndex?:number
	bufferEndIndex?:number
	startIndex?:number
	endIndex?:number
}



interface IVisibleListRowWrapperProps extends IThemedAttributes {
	rowState:IRowState<any,any,any>
}

//@PureRender
class VisibleListRowWrapper extends React.Component<IVisibleListRowWrapperProps,any> {
	
	render() {
		const
			{rowState} = this.props,
			{config,style,key} = rowState,
			{clazz:ComponentClazz,props:rowTypeProps = {}} = config
			
			// THE OUT ROW STATE IS A REF COPY
			//{outRowState} = this.state
		
		return <ComponentClazz key={key} {...(rowTypeProps)} rowState={rowState}  />
	}
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
export class VisibleList<RowType extends any,ItemKeyType extends any,ItemType extends any>
extends React.Component<IVisibleListProps<RowType,ItemKeyType,ItemType>,IVisibleListState<RowType,ItemKeyType,ItemType>> {
	
	static defaultProps = {
		initialItemsPerPage: 20
	}
	
	constructor(props,context) {
		super(props,context)
		this.state = {
			scrollTop: 0,
			rowTypeConfigs: {}
		}
	}
	
	private get hasItemHeight() {
		const
			{itemHeight} = this.props
		return itemHeight && (isFunction(itemHeight) || isNumber(itemHeight))
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
		
		return !isList(heights) ? List<number>(heights) : heights
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
				itemOffsets = List<number>().asMutable()
				
			itemHeights.forEach((nextHeight, index) => {
				if (nextHeight > -1 && (itemHeightMin === -1 || nextHeight < itemHeightMin))
					itemHeightMin = nextHeight
				
				itemOffsets.set(index,itemHeightTotal)
				itemHeightTotal += nextHeight
			})
			
			
			
			assign(heightState,{
				itemOffsets: itemOffsets.asImmutable(),
				itemHeightMin,
				itemHeightTotal,
				itemHeights,
				startIndex: 0,
				endIndex: 0,
				rowStates: this.makeRowStates(props,itemOffsets,itemHeights)
			})
		}
		
		log.debug(`Setting offsets`,heightState)
		
		this.setState(assign({
			styles: createThemedStyles(baseStyles,[]),
			theme: getTheme(),
			itemCache
		},heightState, !this.hasItemHeight && {
			rowStates: this.makeRowStates(props,null,null)
		}),() => this.updateItems(props))
	}
	
	
	makeRowStates = (props,itemOffsets,itemHeights) => {
		const
			{items,itemHeight,rowTypeProvider,itemBuilder} = props,
			{rowTypeConfigs} = this.state,
			{hasItemHeight} = this
		
		let
			rowStates = items.map((item,index) => {
				const
					//key = isFunction(itemKeyFn) ? itemKeyFn(items,item,index) : index,
					key = this.getItemKey(items,index),
					rowType = getValue(() => rowTypeProvider(items,index,key as any), '@@INTERNAL' as any) as any,
					offset = hasItemHeight && itemOffsets.get(index)
					
				
				let
					config = rowTypeConfigs[rowType]
				
				if (!config) {
					rowTypeConfigs[rowType] = config = itemBuilder(rowType)
				}
				
				
				return {
					item,
					index,
					style: makeStyle(
						FillWidth,
						hasItemHeight && makeHeightConstraint(itemHeights.get(index)),
						hasItemHeight  ? {
							position: 'absolute',
							top: !offset || isNaN(offset) ? 0 : offset
						} : {
							position: 'relative'
						}
					),
					config,
					key,
					available: false
				}
				
			}) as any
	
		log.debug(`Dumped row stated`,rowStates)
		
		return rowStates
	}
	
	
	updateItems = (props = this.props,scrollTop = getValue(() => this.state.scrollTop)) => {
		
		if (!this.hasItemHeight) {
			return
		}
		
		
		const
			{state = {}} = this,
			{itemCount,itemHeight,rowTypeProvider,itemBuilder} = props,
			items = props.items as any,
			{height,width,rootElement,itemOffsets,rowTypeConfigs,itemHeights,itemHeightMin} = state

		if (!height || !width || !rootElement || !itemOffsets) {
			log.debug(`Height/width not set yet or no offsets `,height,width,rootElement,itemOffsets)
			return
		}
		
		scrollTop = scrollTop || 0
		
		let
			itemsPerPage = state.itemsPerPage || props.initialItemsPerPage,
			startIndex = 0,
			endIndex = 0

		// If item height is omitted then eventually everything is rendered / simply hidden when not in viewport
		if (itemHeight && itemHeightMin) {
			let
				startSet = false
			
			itemOffsets.forEach((offset,index) => {
				if (offset >= scrollTop && !startSet) {
					startIndex = Math.max(0, index - 1)
					startSet = true
				}
				if (offset > scrollTop + height) {
					endIndex = index
					return false
				}
			})
			
			if (!endIndex)
				endIndex = itemCount
			
			itemsPerPage = endIndex - startIndex
		}
		
		startIndex = Math.max(0,Math.min(startIndex,startIndex - 10))
		endIndex = Math.min(itemCount,Math.min(endIndex,endIndex + 10))
		
		log.debug(`Start`,startIndex,'end',endIndex,'items per page',itemsPerPage)
		
		if (!isNumber(startIndex) || !isNumber(scrollTop)) {
			log.warn(`Start index and scroll top must both be numbers`,startIndex,scrollTop)
			return
		}
		
		// const
		// 	currentItems = itemHeight ?
		// 		items.slice(startIndex, endIndex) :
		// 		items,
		// 	currentRowStates = this.state.rowStates,
		// 	rowStates = currentItems.map((item,index) => {
		// 		const
		// 			realIndex = index + startIndex,
		// 			offset = itemOffsets.get(realIndex),
		// 			key = this.getItemKey(items,realIndex),
		// 			rowType = rowTypeProvider(items,realIndex,key)
		//
		// 		let
		// 			rowState = currentRowStates && currentRowStates.find(it =>
		// 				it.index === realIndex &&
		// 				it.key === key &&
		// 				it.item === item
		// 			),
		// 			config = rowTypeConfigs[rowType as any]
		//
		// 		if (!config) {
		// 			rowTypeConfigs[rowType as any] = config = itemBuilder(rowType)
		// 		}
		//
		//
		// 		if (!rowState) {
		// 			rowState = {
		// 				index: realIndex,
		// 				item,
		// 				key,
		// 				items,
		// 				type:rowType,
		// 				config,
		// 				style: makeStyle(
		// 					FillWidth,
		// 					makeHeightConstraint(itemHeights.get(realIndex)),
		// 					{
		// 						position: 'absolute',
		// 						top: !offset || isNaN(offset) ? 0 : offset
		// 					}
		// 				)
		// 			}
		// 		}
		// 		return rowState
		// 	})
		
		
		log.debug(`New indexes`,startIndex,endIndex)
		
		this.setState({
			startIndex,
			endIndex,
			scrollTop,
			itemsPerPage
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.debounce((event) => {
		if (!this.hasItemHeight)
			return
		
			const
				{scrollTop} = this.state.listElement
		

			this.updateItems(this.props,scrollTop)
			//this.setState({scrollTop},)
		
		
	},250,{
		maxWait: 500
		// leading: false,
		// trailing: true
	})
	
	/**
	 * SHould component update
	 *
	 * ONLY ONLY ONLY WHEN rowComponents size changes
	 *
	 * @param nextProps
	 * @param nextState
	 * @param nextContext
	 * @returns {boolean}
	 */
	shouldComponentUpdate(
		nextProps:IVisibleListProps<RowType,ItemKeyType,ItemType>,
		nextState:IVisibleListState<RowType,ItemKeyType,ItemType>,
		nextContext:any
	):boolean {
		//return !shallowEquals(this.state,nextState,'rowComponents.size')
		//return !shallowEquals(this.props,nextProps,'items') || !shallowEquals(this.state,nextState,'rowStates')
		return !shallowEquals(this.state,nextState,'rowStates')
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
	getItemKey(items:TItems<ItemType>,index:number) {
		const
			{itemKeyProperty,itemKeyFn} = this.props,
			item = !items ? null : Array.isArray(items) ? items[index] : items.get(index)
		
		const itemId =
			itemKeyProperty ?
				_.get(item,itemKeyProperty,index) :
				itemKeyFn ?
					itemKeyFn(items,item,index) :
					index
		
		return (isNil(itemId) ? index : itemId) as ItemKeyType
	}
	
	/**
	 * On render
	 *
	 * @returns {any}
	 */
	render() {
		const
			{props,state = {}} = this,
			{itemHeight,className} = props,
			{rowStates,itemHeightTotal,styles} = state
			
			
		
		// let
		// 	contentHeight = itemHeightTotal//((items as any).size || (items as any).length) * itemHeightMin
		
		return <Resizable style={[styles.root,PositionRelative]}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={styles.list}
			     ref={this.setListRef}
			     onScroll={this.onScroll}
			     className={`visible-list ${className || ''}`}
			     data-visible-list="true">
				
				{/* SCROLL ITEMS CONTAINER - total item height */}
				<div style={makeStyle(
					styles.list.content,
					itemHeight && {
						height:isNaN(itemHeightTotal) ? 0 : itemHeightTotal
					}
				)}>
					{rowStates && rowStates.map(rowState => {
						const
							{config,style,key} = rowState,
							{clazz:ComponentClazz,props:rowTypeProps = {}} = config
						
						// THE OUT ROW STATE IS A REF COPY
						//{outRowState} = this.state
						
						return <ComponentClazz key={key} {...rowTypeProps} style={style} rowState={rowState}  />
					})}
				</div>
			</div>
		</Resizable>
	}
	
}