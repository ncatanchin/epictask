import * as React from 'react'
import {HeaderComponent} from './'

/**
 * The root container for the app
 */
export class RootContainerComponent extends React.Component<any,any> {

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
			<div style={canvasStyle}>
				{this.props.children}
			</div>
		)
	}
}


