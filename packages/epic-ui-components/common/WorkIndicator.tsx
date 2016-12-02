// Imports
import { PureRender } from 'epic-ui-components/common'
import { IThemedAttributes, Themed } from 'epic-styles'
import { Fill, PositionAbsolute, FlexColumnCenter } from "epic-styles/styles"


// Constants
const
	log = getLogger(__filename),
	CircularProgress = require("material-ui/CircularProgress").default

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


/**
 * IWorkIndicatorProps
 */
export interface IWorkIndicatorProps extends IThemedAttributes {
	open:boolean
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
	
	render() {
		const { open, theme } = this.props
		
		return !open ? React.DOM.noscript() : <div style={[PositionAbsolute,Fill,FlexColumnCenter,{
			top: 0,
			left: 0,
			zIndex: 89889786686
		}]}>
			<CircularProgress
				color={theme.progressIndicatorColor}
				size={50}/>
		</div>
		
	}
	
}