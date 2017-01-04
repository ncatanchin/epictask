// Imports
import { PureRender } from '../PureRender'
import { ThemedStyles, IThemedAttributes } from 'epic-styles'
import { Icon, IIconProps } from "./Icon"
import filterProps from 'react-valid-props'
import { ITooltipNodeProps } from "../Tooltip"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [ Styles.FlexRowCenter, Styles.FlexAuto, Styles.CursorPointer, Styles.makePaddingRem(0.5,1,0.5,1), {} ]
}


/**
 * IIconButtonProps
 */
export interface IIconButtonProps extends IThemedAttributes,IIconProps,ITooltipNodeProps {
}

/**
 * IIconButtonState
 */
export interface IIconButtonState {
	
}

/**
 * IconButton
 *
 * @class IconButton
 * @constructor
 **/
@ThemedStyles(baseStyles)
@PureRender
export class IconButton extends React.Component<IIconButtonProps,IIconButtonState> {
	
	render() {
		const
			{ styles,style,tooltip,tooltipPos,iconSet,iconName } = this.props,
			filteredProps = filterProps(this.props)
		
		return <Icon {...filteredProps} {...{tooltip,tooltipPos,iconSet,iconName}} style={mergeStyles(styles,style)}>
			{this.props.children}
		</Icon>
	}
	
}