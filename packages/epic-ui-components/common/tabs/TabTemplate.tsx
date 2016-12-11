// Imports
import { connect } from "react-redux"
import { PureRender } from "../PureRender"
import { createStructuredSelector } from "reselect"
import {
	ThemedStyles,
	IThemedAttributes,
	makeHeightConstraint,
	PositionRelative,
	makeTransition,
	FlexScale
} from "epic-styles"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexScale, Styles.FlexColumn,Styles.PositionRelative, Styles.OverflowAuto, Styles.makeTransition(['height','max-height','min-height']), {
			hidden: [makeHeightConstraint(0)]
	} ]
}


/**
 * ITabTemplateProps
 */
export interface ITabTemplateProps extends IThemedAttributes {
	children: React.ReactNode
	selected?: boolean
}

/**
 * ITabTemplateState
 */
export interface ITabTemplateState {
	
}

/**
 * TabTemplate
 *
 * @class TabTemplate
 * @constructor
 **/

@connect(createStructuredSelector({
	// Props mapping go here, use selectors
}))

// If you have a specific theme key you want to
// merge provide it as the second param
@ThemedStyles(baseStyles)
@PureRender
export class TabTemplate extends React.Component<ITabTemplateProps,ITabTemplateState> {
	
	render() {
		const { styles,children,selected } = this.props
		
		return <div style={[styles]}>
			{children}
		</div>
	}
	
}