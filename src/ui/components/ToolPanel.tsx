// Imports
import * as React from 'react'
import {connect} from 'react-redux'
import * as Radium from 'radium'
import {PureRender, Button, Icon,filterProps} from 'ui/components/common'
import {createDeepEqualSelector} from 'shared/util/SelectorUtil'
import {createStructuredSelector} from 'reselect'
import {ThemedStyles} from 'shared/themes/ThemeManager'
import {ToolPanelLocation, IToolPanel, ITool} from "shared/tools/ToolTypes"
import {uiStateSelector} from "shared/actions/ui/UISelectors"

// Constants
const log = getLogger(__filename)

// Styles

const
	gutterDim = rem(2),
	gutterVertical = [FlexColumn,FlexAuto,OverflowHidden,{
		minWidth: gutterDim,
		maxWidth: gutterDim,
		width: gutterDim
	}],
	gutterHorizontal = [FlexRow,FlexAuto,OverflowHidden,{
		minHeight: gutterDim,
		maxHeight: gutterDim,
		height: gutterDim
	}],
	baseStyles = createStyles({
		root: [FlexColumn, FlexAuto, {
		
			[ToolPanelLocation.Left]: [FlexRow],
			[ToolPanelLocation.Right]: [FlexRow],
			[ToolPanelLocation.Bottom]: [FlexColumn],
			[ToolPanelLocation.Window]: [FlexColumn]
		
		}],
		
		gutter: [{
			[ToolPanelLocation.Left]: [...gutterVertical],
			[ToolPanelLocation.Right]: [...gutterVertical],
			[ToolPanelLocation.Window]: [...gutterHorizontal],
			[ToolPanelLocation.Bottom]: [...gutterHorizontal],
			
			/**
			 * Toggle button for opening/focusing tool
			 */
			toggle: [makeTransition(['opacity']),FlexColumnCenter,PositionAbsolute,{
				opacity: 0,
				pointerEvents: 'none',
				textAlign: 'center',
				width: rem(2),
				padding: 0,
				
				visible: [{
					opacity: 1,
					pointerEvents: 'auto',
					zIndex: 9999
				}],
				
				// Arrow Button
				button: [{
					padding: "0.5rem 0.3rem",
					width: rem(2),
					height: rem(2)
				}],
				
				// Label
				label: [{
					padding: "0.5rem 0.3rem",
					fontSize: rem(0.9),
					
					[ToolPanelLocation.Left]: [{
						textOrientation: "sideways-right",
						writingMode: "vertical-lr",
						transform: "rotate(0.5turn)"
					}],
					
					[ToolPanelLocation.Right]: [{
						textOrientation: "sideways-left",
						writingMode: "vertical-lr",
						transform: "rotate(-0.5turn)"
					}],
				}]
				
				
			}]
		}]
		
		
	})




/**
 * IToolPanelProps
 */
export interface IToolPanelProps extends React.HTMLAttributes {
	theme?:any
	styles?:any
	id?:string
	location:ToolPanelLocation
	panel?:IToolPanel
}

/**
 * Tool toggle button
 *
 * @param props
 * @returns {any}
 * @constructor
 */
function ToolToggleButton(props) {
	return <Button tabIndex={-1} {...filterProps(props)}>
		<Icon style={props.iconStyle} iconSet='fa' iconName='chevron-right'/>
		<div style={props.labelStyle}>
			Repos
		</div>
	</Button>
	
}


/**
 * ToolPanel
 *
 * @class ToolPanel
 * @constructor
 **/

@connect(createStructuredSelector({
	panel: (state,props:IToolPanelProps) => uiStateSelector(state).toolPanels.find(it =>
		it.location === props.location &&
		(props.location !== ToolPanelLocation.Window || it.id === props.id)
	)// Props mapping go here, use selectors
}, createDeepEqualSelector))


// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles,'toolPanel')
@Radium
@PureRender
export class ToolPanelComponent extends React.Component<IToolPanelProps,any> {
	
	static displayName = 'ToolPanel'
	
	render() {
		const {theme, styles} = this.props
		
		return <div style={styles.root}>
		</div>
	}
	
}