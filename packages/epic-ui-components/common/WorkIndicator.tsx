// Imports
import "!!style-loader!css-loader!react-spinkit/css/double-bounce.css"
import "!!style-loader!css-loader!react-spinkit/css/cube-grid.css"
import Spinner = require('react-spinkit')
import * as React from "react"
import { Style } from "radium"

import { IThemedAttributes, ThemedStyles } from "epic-styles"
import { PureRender } from "./PureRender"

// Constants
const
	log = getLogger(__filename)

// DEBUG OVERRIDE
//log.setOverrideLevel(LogLevel.DEBUG)


function baseStyles(topStyles, theme, palette) {
	
	const
		{ text, primary, accent, background } = palette,
	bounceStyle = {
		backgroundColor: accent.hue1
	}
	
	return [ {
		
		'.sk-cube-grid': {
			width: 50,
			height: 50
		},
		'.sk-cube': bounceStyle,
		'.sk-double-bounce': {
			width: 50,
			height: 50
		},
		'.sk-double-bounce1': bounceStyle,
		'.sk-double-bounce2': bounceStyle
		
	} ]
}

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

@ThemedStyles(baseStyles)
@PureRender
export class WorkIndicator extends React.Component<IWorkIndicatorProps, void> {
	static defaultProps = {
		open: true
	}
	
	render() {
		const
			{ open, style,styles, theme } = this.props
		
		return !open ? React.DOM.noscript() :
			<div
				style={[
					Styles.makeTransition([ 'opacity', 'background', 'background-color' ]),
					Styles.PositionAbsolute,
					Styles.Fill,
					Styles.FlexColumnCenter, {
						top: 0,
						left: 0,
						zIndex: 89889786686
					},
					style
				]}>
				<Style
					rules={styles}
				/>
				<Spinner spinnerName="cube-grid"/>
			</div>
		
	}
	
}