// Imports
import filterProps from 'react-valid-props'
import { PureRender } from './PureRender'
import { makeHeightConstraint,IThemedAttributes, ThemedStyles } from 'epic-styles'

import { Icon } from "epic-ui-components/common/icon/Icon"


// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette
	
	return [
		Styles.makePaddingRem(1,1.5),
		Styles.FlexColumnCenter,
		Styles.FillHeight,
		Styles.makeTransition('background-color'),{
			cursor: 'pointer',
			
			icon: [makeHeightConstraint(rem(1.8)),{
				fontSize: rem(1.8),
				cursor: 'pointer',
			}]
	}]
}


/**
 * IFormButtonProps
 */
export interface IFormButtonProps extends IThemedAttributes {
	hoverHighlight?:'warn'|'accent'|'success'|'secondary'
	icon?: IIcon
}

/**
 * IFormButtonState
 */
export interface IFormButtonState {
	
}

/**
 * FormButton
 *
 * @class FormButton
 * @constructor
 **/

@ThemedStyles(baseStyles)
@PureRender
export class FormButton extends React.Component<IFormButtonProps,IFormButtonState> {
	
	static defaultProps = {
		hoverHighlight: 'accent'
	}
	
	/**
	 * On mount set state for tracking hover
	 */
	componentWillMount() {
		this.state = {}
	}
	
	/**
	 * Render the button
	 *
	 * @returns {any}
	 */
	render() {
		const
			{ styles,hoverHighlight,palette,icon} = this.props
		
		return <div
			{...filterProps(this.props)}
			tabIndex={0}
			style={[styles,{
				[Styles.CSSHoverState]: {
					backgroundColor: palette[hoverHighlight].hue1
				}
			}]}>
			
			{/* ICON */}
			{icon && <Icon
				{...icon}
				style={[styles.icon]}
			/>}
			
			{/* CHILDREN */}
			{this.props.children}
		</div>
	}
	
}