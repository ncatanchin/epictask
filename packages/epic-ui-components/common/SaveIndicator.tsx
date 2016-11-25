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
 * ISaveIndicatorProps
 */
export interface ISaveIndicatorProps extends IThemedAttributes {
	open:boolean
}


/**
 * SaveIndicator
 *
 * @class SaveIndicator
 * @constructor
 **/

@Themed
@PureRender
export class SaveIndicator extends React.Component<ISaveIndicatorProps,void> {
	
	render() {
		const { open, theme } = this.props
		
		return !open ? React.DOM.noscript() : <div style={[PositionAbsolute,Fill,FlexColumnCenter,{
			top: 0,
			left: 0
		}]}>
			<CircularProgress
				color={theme.progressIndicatorColor}
				size={50}/>
		</div>
		
	}
	
}