// Imports

import { DragLayer } from "react-dnd"
import { ThemedStyles, IThemedAttributes, PositionAbsolute } from "epic-styles"
import { ToolGutterButton } from "./ToolGutterButton"
import { getValue, shallowEquals } from "epic-global"

// Constants
const
	log = getLogger(__filename)

const baseStyles = (topStyles, theme, palette) => ({
	root: [ FillWindow, {
		position: 'fixed',
		top: 0,
		left: 0,
		pointerEvents: 'none',
		zIndex: 999999
	} ]
})

const makeItemPosition = ({ x, y }) => ({
	//transform: `translate(${x}px,${y}px)`
	
})


/**
 * IToolDragLayerProps
 */
export interface IToolDragLayerProps extends IThemedAttributes {
	item?:any
	itemType?:string
	currentOffset?:{x:number,y:number}
	isDragging?:boolean
}

/**
 * IToolDragLayerState
 */
export interface IToolDragLayerState {
	itemStyle?:any
	itemNode?:any
}

/**
 * ToolDragLayer
 *
 * @class ToolDragLayer
 * @constructor
 **/

@(DragLayer as any)(monitor => ({
	item: monitor.getItem(),
	itemType: monitor.getItemType(),
	currentOffset: monitor.getSourceClientOffset(),
	isDragging: monitor.isDragging()
}))
@ThemedStyles(baseStyles)
export class ToolDragLayer extends React.Component<IToolDragLayerProps,IToolDragLayerState> {
	
	/**
	 * Create a new drag layer
	 *
	 * @param props
	 * @param context
	 */
	constructor(props, context) {
		super(props, context)
		
		this.state = {}
	}
	
	/**
	 * Update the layer state
	 *
	 * @param props
	 */
	private updateState = (props = this.props) => {
		
		const
			{ currentOffset, item } = props
		
		if (
			shallowEquals(props, this.props, 'isDragging', 'currentOffset', 'item') &&
			getValue(() => this.state.itemStyle)
		) {
			return
		}
		
		this.setState({
			itemStyle: (!currentOffset) ?
				null :
				makeStyle(PositionAbsolute, {
					top: currentOffset.y,
					left: currentOffset.x,
					zIndex: 99999,
					pointerEvents: 'none',
				})
		})
	}
	
	/**
	 * On initial mount - update the state
	 */
	componentWillMount = this.updateState
	
	/**
	 * Component will receive new props
	 */
	componentWillReceiveProps = this.updateState
	
	
	/**
	 * Render the layer
	 * @returns {any}
	 */
	render() {
		const
			{ item, isDragging, styles, palette } = this.props,
			{ tool, panel } = item || {} as any,
			{ itemStyle, itemNode } = this.state || {} as any
		
		//log.info(`Rendering custom drag layer`,isDragging,tool,panel,item,currentOffset)
		
		return  <div id="toolDragLayer" style={styles.root}>
			
			{isDragging &&
			<div style={itemStyle}>
				<ToolGutterButton
					style={makeStyle({
							zIndex:99999,
							pointerEvents: 'none',
							transition: 'none'
							})}
					buttonStyle={{backgroundColor: palette.accent.hue1,transition: 'none'}}
					tool={tool}
					panel={panel}/>
			</div>
			}
		
		</div>
	}
	
}