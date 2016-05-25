import * as React from 'react'
import {Header} from './'

/**
 * The root container for the app
 */
export class Container extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	render() {
		const theme = getTheme()

		/**
		 * Creates an inline style from
		 * the current theme
		 *
		 * @type {{backgroundColor: string}}
		 */
		const canvasStyle = {
			backgroundColor: theme.palette.canvasColor
		}

		return (
			<div className="fill-width fill-height" style={canvasStyle}>
				{this.props.children}
			</div>
		)
	}
}


