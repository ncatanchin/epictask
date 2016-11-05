// Imports
import {List,Map,Iterable} from 'immutable'
import CSSTransitionGroup from 'react-addons-css-transition-group'
import { createThemedStyles, getTheme } from "epic-styles"
import { isNumber, isNil, isFunction } from  "epic-global"
import {shallowEquals,uuid} from "epic-global"
import { getValue, isList } from "typeguard"
import { unwrapRef } from "epic-global/UIUtil"
import { IThemedAttributes } from "epic-styles/ThemeDecorations"
import { makeHeightConstraint } from "epic-styles/styles/CommonRules"
import { SimpleEventEmitter } from "epic-global/SimpleEventEmitter"
import { cloneObjectShallow } from "epic-global/ObjectUtil"
import { PureRender } from "epic-ui-components/common/PureRender"



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
}

type TRowStateListener = (outRowState:IRowState<any,any,any>) => any

class RowState<RowType,ItemKeyType,ItemType> extends SimpleEventEmitter<TRowStateListener> implements IRowState<RowType,ItemKeyType,ItemType> {
	
	id = uuid()
	type:RowType
	item:ItemType
	items:TItems<ItemType>
	key:ItemKeyType
	index:number
	style:any
	available:boolean
	component?:VisibleListRowWrapper
	config: IRowTypeConfig<RowType,ItemKeyType,ItemType>
	
	constructor() {
		super()
		
	}
	
	update(newState) {
		
		assign(this,newState)
		//_.pick(this,'available','type','item','items','key','index','style') as any
		this.emit(newState)
	}
	
}




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

export type TRowComponents<RowType extends any,ItemKeyType extends any,ItemType extends any> = Map<RowType,List<RowState<RowType,ItemKeyType,ItemType>>>

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
	rowStates?:List<RowState<RowType,ItemKeyType,ItemType>>
	lastItems?:TItems<ItemType>
	rootElement?:any
	listElement?:any
	itemsPerPage?:number
	
	
	
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



function updateRowTypeComponents<RowType extends any,ItemKeyType extends any,ItemType extends any>
(
	rowTypeComponents:TRowComponents<RowType,ItemKeyType,ItemType>,
	startIndex:number,
	endIndex:number,
	items:TItems<ItemType>,
	itemsToPrepare,
	currentItems
) {
	let
		preparedRowStates = List<RowState<RowType,ItemKeyType,ItemType>>()
		//preparedComponents = List<IVisibleListRowComponent<RowType,ItemKeyType,ItemType>>()
	
	rowTypeComponents = rowTypeComponents.withMutations(newRowTypeComponents => {
		const
			rowTypes = newRowTypeComponents.keySeq()
		
		rowTypes.forEach((rowType) => {
			let
				rows = newRowTypeComponents.get(rowType)
			
			rows = rows.withMutations(newRows => {
				newRows.forEach((row,rowIndex) => {
					const
						{
							index:itemIndex,
							item,
							available,
							component
						} = row,
						inUse = !available && // CHECK TO SEE IF IT HAS ANY VALUE
							currentItems.indexOf(item) > -1 &&
							item && // ENSURE WE HAVE AN ITEM
							itemIndex >= startIndex && // CHECK INDEXES
							itemIndex <= endIndex &&
							item === items.get(itemIndex) // FINALLY MAKE SURE THE ITEM HAS NOT CHANGED
					
					if (inUse) {
						const
							prepItemIndex = itemsToPrepare.findIndex(it => it.item === item)
						
						if (prepItemIndex === -1) {
							log.error(`Item now found in prep items, but marked in use`,
								row,
								item,
								prepItemIndex,
								itemsToPrepare,
								currentItems)
							
						} else {
							itemsToPrepare = itemsToPrepare.remove(prepItemIndex)
							//preparedComponents = preparedComponents.push(component) as any
							preparedRowStates = preparedRowStates.push(row)
						}
						
						return
					}
					
					
					row.update({
						available: true,
						item: null,
						index: null,
						key: null
					})
					
					newRows = newRows.set(rowIndex,row)
				})
				
				return newRows
			})
			
			newRowTypeComponents.set(rowType,rows)
		})
		
		return newRowTypeComponents
	})
	
	return {
		itemsToPrepare,
		//preparedComponents,
		preparedRowStates,
		rowTypeComponents
	}
}


interface IVisibleListRowWrapperProps extends IThemedAttributes {
	rowState:RowState<any,any,any>
}

@PureRender
class VisibleListRowWrapper extends React.Component<IVisibleListRowWrapperProps,any> {
	
	
	// UPDATE_DELAY = Math.round(Math.random() * 300) + 300
	//
	// constructor(props,context) {
	// 	super(props,context)
	//
	// 	log.debug(`Using update delay ${this.UPDATE_DELAY}`)
	// 	this.state = {
	// 		outRowState: props.rowState
	// 	}
	// }
	
	// private onUpdate = _.debounce((rowState) => {
	// 	//log.debug(`New row state data`,this.props.rowState)
	// 	if (getValue(() => this.state.mounted,false))
	// 		this.forceUpdate()
	// },this.UPDATE_DELAY,{maxWait:this.UPDATE_DELAY + 150})
	//
	// componentWillMount() {
	// 	//this.setState({mounted:true},() => this.props.rowState.addListener(this.onUpdate))
	//
	//
	// }
	//
	// componentWillUnmount() {
	// 	//this.props.rowState.removeListener(this.onUpdate)
	// 	//this.setState({mounted:false})
	//
	// }
	//
	// shouldComponentUpdate(nextProps,nextState) {
	// 	return !shallowEquals(this.props,nextProps,'rowState.index','rowState.item')
	//
	// }
	
	render() {
		const
			{rowState} = this.props,
			{config,style,id} = rowState,
			{clazz:ComponentClazz,props:rowTypeProps = {}} = config
			
			// THE OUT ROW STATE IS A REF COPY
			//{outRowState} = this.state
		
		return <ComponentClazz key={id} {...(rowTypeProps)} rowState={rowState}  />
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
			rowTypeComponents: Map<RowType,List<RowState<RowType,ItemKeyType,ItemType>>>()
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
				endIndex: 0
			})
		}
		
		log.debug(`Setting offsets`,heightState)
		
		this.setState(assign({
			styles: createThemedStyles(baseStyles,[]),
			theme: getTheme(),
			itemCache
		},heightState),() => this.updateItems(props))
	}
	
	
	dumpItems = (props = this.props) => {
		const
			{state = {}} = this,
			{items,itemCount,itemHeight,rowTypeProvider,itemKeyFn,itemBuilder} = props,
			rowTypeConfigs = {} as any
		
		let
			rowStates = items.map((item,index) => {
				const
					rowState = new RowState(),
					key = isFunction(itemKeyFn) ? itemKeyFn(items,item,index) : index,
					rowType = getValue(() => rowTypeProvider(items,index,key as any), '@@INTERNAL' as any) as any
				
				let
					config = rowTypeConfigs[rowType]
				
				if (!config) {
					rowTypeConfigs[rowType] = config = itemBuilder(rowType)
				}
				
				
				rowState.update({
					item,
					index,
					style: makeStyle(FillWidth,{
						position: 'relative'
					}),
					config,
					key,
					available: false
				})
				
				return rowState
			}) as any
	
		log.debug(`Dumped row stated`,rowStates)
		
		this.setState({
			rowStates
		})
	}
	
	
	updateItems = (props = this.props,scrollTop = getValue(() => this.state.scrollTop)) => {
		
		if (!this.hasItemHeight) {
			this.dumpItems(props)
			return
		}
		
		
		const
			{state = {}} = this,
			{itemCount,itemHeight,rowTypeProvider,itemBuilder} = props,
			items = props.items as any,
			{height,width,rootElement,itemOffsets,itemCache,itemHeights,itemHeightMin} = state

		let
			{bufferStartIndex,bufferEndIndex,rowTypeComponents} = state
		
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
			
			itemsPerPage = endIndex - startIndex
			
			
			// if (
			// 	startIndex !== endIndex && isNumber(bufferStartIndex) && isNumber(bufferEndIndex) &&
			// 	bufferEndIndex > bufferStartIndex &&
			// 	bufferEndIndex - bufferStartIndex >= itemsPerPage &&
			// 	startIndex >= bufferStartIndex &&
			// 	endIndex <= bufferEndIndex) {
			// 	log.debug(`Valid buffer range ${bufferStartIndex}-${bufferEndIndex} and we are in it ${startIndex}-${endIndex}`)
			// 	return
			// }
			//
			// const
			// 	BUFFER_ITEMS = 5 // itemsPerPage
			//
			// bufferStartIndex = Math.max(0,startIndex - BUFFER_ITEMS)
			// bufferEndIndex = Math.min(itemCount,endIndex + BUFFER_ITEMS)
			
			//
			// const
			// 	visibleIndex = Math.max(0, (.findIndex(offset => offset >= scrollTop) - 1) || 0)
			//
			// startIndex = visibleIndex
			// endIndex = Math.min(itemCount, visibleIndex + itemsPerPage + itemsPerPage)
		}
			
		log.debug(`Start`,startIndex,'end',endIndex,'items per page',itemsPerPage)
		
		if (!isNumber(startIndex) && isNumber(scrollTop)) {
			log.warn(`Start index and scroll top must both be numbers`,startIndex,scrollTop)
			return
		}
		
		const
			currentItems = itemHeight ?
				items.slice(startIndex, endIndex) :
				items
		
		let
			itemsToPrepare = List(currentItems.map((item,index) => {
				const
					realIndex = index + startIndex
				return {
					item,
					realIndex,
					key:this.getItemKey(items,realIndex)
				}
			}) as any) as any
			
		// ITERATE EXISTING COMPONENTS, MARKING AVAILABLE/IN-USE
		const
			rowTypesUpdate = updateRowTypeComponents(rowTypeComponents,startIndex,endIndex,items,itemsToPrepare,currentItems)
		
		rowTypeComponents = rowTypesUpdate.rowTypeComponents as any
		itemsToPrepare = rowTypesUpdate.itemsToPrepare as any
		
		let
			//{preparedComponents} = rowTypesUpdate
			{preparedRowStates} = rowTypesUpdate
		
		rowTypeComponents = rowTypeComponents.withMutations((newRowTypeComponents:any) => {
			// PREPARE ANY NEW OR REQUIRED COMPONENTS
			const
				groupedItemsToPrepare = Map(itemsToPrepare.groupBy(({key,realIndex}) =>
					!rowTypeProvider ? ("NO-ROW-TYPE-PROVIDER" as any) : rowTypeProvider(items,realIndex,key)
				)) as any
			
			groupedItemsToPrepare.forEach((rowTypeItemsToPrepare,rowType) => {
				let
					rowComponents = newRowTypeComponents.get(rowType)
				
				if (!rowComponents) {
					rowComponents = List<RowState<RowType,ItemKeyType,ItemType>>()
				}
				
				// ITERATE THE PRE ITEMS FOR THE ROW TYPE AND CREATE ANYTHING MISSING
				rowComponents = rowComponents.withMutations(newRowComponents => {
					let
						availableRows = List<{rowComponent:RowState<RowType,ItemKeyType,ItemType>,rowIndex}>(
							newRowComponents
								.map((rowComponent,rowIndex) => ({rowComponent,rowIndex}))
								.filter(({rowComponent}) => rowComponent.available)
						)
					
					log.debug(`Total components for ${rowType} = ${newRowComponents.size} / available = ${availableRows.size}`)
					rowTypeItemsToPrepare.forEach(({item,key,realIndex}) => {
						let
							rowComponent:RowState<RowType,ItemKeyType,ItemType>,
							rowIndex:number
						
						if (availableRows.size) {
							const
								rowItem = availableRows.last()
							
							availableRows = availableRows.pop()
							
							rowComponent = getValue(() => rowItem.rowComponent)
							rowIndex = getValue(() => rowItem.rowIndex,-1)
						}
						
						if (!rowComponent) {
							rowIndex = -1
							rowComponent = assign(new RowState(),{
								type:rowType,
								config: itemBuilder(rowType)
							})
							//rowComponent.component = <VisibleListRowWrapper key={rowComponent.id} rowState={rowComponent} /> as any
						} else {
							rowComponent = cloneObjectShallow(rowComponent)
						}
						
						
						
						// NOW STYLE THE COMPONENT
						const
							offset = itemOffsets.get(realIndex),
							{clazz:RowComponentClazz,props:rowTypeProps} = rowComponent.config
						
						rowComponent.update({
							available: false,
							index: realIndex,
							item,
							key,
							items,
							style: makeStyle(
								FillWidth,
								makeHeightConstraint(itemHeights.get(realIndex)),
								{
									position: 'absolute',
									top: !offset || isNaN(offset) ? 0 : offset
								}
							)
						})
						
						log.debug(`Setting new row state`)
						
						//unwrappedComponent.setRowState(newRowState)
						
						// PUSH TO THE PREPARED LIST
						//preparedComponents = preparedComponents.push(rowComponent.component)
						preparedRowStates = preparedRowStates.push(rowComponent)
						newRowComponents =  (rowIndex < 0) ?
							newRowComponents.push(rowComponent) :
							newRowComponents.set(rowIndex,rowComponent)
							
					})
					
					return newRowComponents
				})
				
				newRowTypeComponents.set(rowType,rowComponents)
				return newRowTypeComponents
			})
			
			// itemsToPrepare.forEach(({item,realIndex},prepItemIndex) => {
			// 	const
			// 		key = this.getItemKey(items,realIndex),
			// 		rowType = rowTypeProvider(items,realIndex,key)
			//
			//
		})
		
			//
			// 		.map((item, index) => {
			// 		index += startIndex
			//
			// 		const
			// 			offset = itemOffsets.get(index),
			// 			style = makeStyle(FillWidth,{
			// 				position: 'absolute',
			// 				top: !offset || isNaN(offset) ? 0 : offset,
			// 				height: itemHeights.get(index)
			// 			}),
			// 			indexId = `${index}`,
			// 			key = this.getItemKey(items,index)
			//
			//
			// 		return this.getItemComponent(itemCache,itemRenderer,items,item,key,index,style)
			//
			// 		//return itemRenderer(items, index,style,key)
			//
			// 	}) : items.map((item, index) => {
			// 	const
			// 		style = makeStyle(FillWidth,{
			// 			position: 'relative'
			// 		}),
			// 		indexId = `${index}`,
			// 		key = this.getItemKey(items,index)
			//
			// 	return this.getItemComponent(itemCache,itemRenderer,items,item,key,index,style)
			// 	//return itemCache[item] || (itemCache[item] = itemRenderer(items, index,style,key))
			// 	//return itemRenderer(items, index,style,key)
			// }))
			//
		log.debug(`Prepared components`,preparedRowStates,rowTypeComponents,startIndex,endIndex)
		this.setState({
			itemCache,
			startIndex,
			endIndex,
			bufferStartIndex,
			bufferEndIndex,
			scrollTop,
			rowTypeComponents,
			rowStates: List(preparedRowStates),
			//rowComponents:List(preparedComponents),
			itemsPerPage,
			currentItems: currentItems || []
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.debounce((event) => {
		if (!this.hasItemHeight)
			return
		
		//
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

			setImmediate(() => this.updateItems(this.props,scrollTop))
			//this.setState({scrollTop},)
		
		
	},350,{maxWait:600})
	
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
		return !shallowEquals(this.props,nextProps,'items') || !shallowEquals(this.state,nextState,'rowStates')
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
		} else if (!shallowEquals(itemReg.style,style,'top','height')) {
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
			{rowStates,rowComponents,itemHeightTotal,styles} = state
			
			
		
		// let
		// 	contentHeight = itemHeightTotal//((items as any).size || (items as any).length) * itemHeightMin
		
		return <Resizable style={styles.root}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={[styles.list]} ref={this.setListRef} onScroll={this.onScroll} className={`visible-list ${className || ''}`} data-visible-list="true">
				
				{/* SCROLL ITEMS CONTAINER - total item height */}
				<div style={[styles.list.content,itemHeight && {height:isNaN(itemHeightTotal) ? 0 : itemHeightTotal}]}>
					{rowStates && rowStates.map(rowState =>
						<VisibleListRowWrapper key={rowState.id} rowState={rowState} />
					)}
				</div>
			</div>
		</Resizable>
	}
	
}