// Imports
import * as React from 'react'
import { connect } from 'react-redux'
import * as Radium from 'radium'
import { PureRender } from 'ui/components/common/PureRender'
import { createDeepEqualSelector } from 'shared/util/SelectorUtil'
import { createStructuredSelector } from 'reselect'
import { ThemedStyles } from 'shared/themes/ThemeManager'
import { debounce } from "lodash-decorators"

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


/**
 * IVisibleListProps
 */
export interface IVisibleListProps extends React.HTMLAttributes<any> {
	theme?:any
	styles?:any
	items:any[]
	itemHeight?:number
	itemRenderer:(items:any[], index:number) => React.ReactElement<any>
	initialItemsPerPage?:number
	bufferPages?:number
	
}

/**
 * IVisibleListState
 */
export interface IVisibleListState {
	width?:number
	height?:number
	rootElement?:any
	listElement?:any
	itemsPerPage?:number
	startIndex?:number
	endIndex?:number
	scrollTop?:number
	currentItems?:any[]
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
		initialItemsPerPage: 20,
		bufferPages: 2
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
			{bufferPages,items,itemRenderer} = props,
			{height,width,rootElement,scrollTop} = state
		
		if (!height || !width || !rootElement) {
				log.warn(`Height/width not set yet `,height,width,rootElement)
				return
		}
		
		let
			itemsPerPage = state.itemsPerPage || props.initialItemsPerPage,
			{itemHeight} = props,
			{currentItems} = state,
			startIndex = 0,
			endIndex = items.length
		
		// If item height is omitted then eventually everything is rendered / simply hidden when not in viewport
		if (itemHeight) {
			itemsPerPage = Math.ceil(height / itemHeight)
			
			const
				visibleIndex = Math.max(0,Math.floor(scrollTop / itemHeight)) || 0
			
			startIndex = Math.max(0, visibleIndex - (bufferPages * itemsPerPage))
			endIndex = visibleIndex + itemsPerPage + (itemsPerPage * bufferPages)
			
			currentItems = items
				.slice(startIndex, endIndex)
				.map((item, index) => {
					index += startIndex
					return <div key={index} style={makeStyle(FillWidth,{
							position: 'absolute',
							top: (itemHeight * index) || 0,
							height:itemHeight
							
						})}>
						{itemRenderer(items, index)}
					</div>
				})
		} else {
			currentItems = items.map((item, index) => {
				return <div key={index} style={makeStyle(FillWidth,{
							position: 'relative'
						})}>
					{itemRenderer(items, index)}
				</div>
			})
		}
		
		log.info(`Start`,startIndex,'end',endIndex)
		
		this.setState({
			scrollTop,
			startIndex,
			endIndex,
			itemsPerPage,
			currentItems
		})
	}
	
	/**
	 * On scroll event is debounced
	 */
	private onScroll = _.debounce((event) => {
		const
			{scrollTop} = this.state.listElement
		
		this.setState({scrollTop},this.updateState)
	},150,{
		maxWait: 300
	})
	
	/**
	 * On resize
	 *
	 * @param width
	 * @param height
	 */
	private onResize = ({width,height}) => {
		log.info(`Container resized ${width}/${height}`)
		this.setState({width,height}, () => this.updateState())
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
			{theme, styles, items,itemRenderer,itemHeight} = props,
			{startIndex,endIndex,currentItems} = state
		
		return <Resizable style={styles.root}
		                  ref={this.setRootRef}
		                  onResize={this.onResize}>
			<div style={[styles.list]} ref={this.setListRef} onScroll={this.onScroll}>
				<div style={[styles.list.content,itemHeight && {
					height:items.length * itemHeight
				}]}>
					{currentItems}
				</div>
			</div>
		</Resizable>
	}
	
}