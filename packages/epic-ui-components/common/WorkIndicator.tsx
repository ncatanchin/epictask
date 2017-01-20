// Imports
import { IThemedAttributes, Themed, Fill, PositionAbsolute, FlexColumnCenter } from "epic-styles"
import { PureRender } from "./PureRender"
import { CircularProgress } from "./MaterialUIComponents"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * IWorkIndicatorProps
 */
export interface IWorkIndicatorProps extends IThemedAttributes {
	open?:boolean
}


/**
 * WorkIndicator
 *
 * @class WorkIndicator
 * @constructor
 **/

@Themed
@PureRender
export class WorkIndicator extends React.Component<IWorkIndicatorProps,void> {
	static defaultProps = {
		open: true
	}
	
	render() {
		const { open, style,theme } = this.props
		
		return !open ? React.DOM.noscript() :
			<div
				style={[
					makeTransition(['opacity','background','background-color']),
					PositionAbsolute,
					Fill,
					FlexColumnCenter,{
						top: 0,
						left: 0,
						zIndex: 89889786686
					},
					style
				]}>
			<CircularProgress
				color={theme.progressIndicatorColor}
				size={50}/>
		</div>
		
	}
	
}