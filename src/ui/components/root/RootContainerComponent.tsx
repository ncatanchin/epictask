import * as React from 'react'

const log = getLogger(__filename)


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
		const rootStyles = {
			backgroundColor: theme.palette.canvasColor,
			flex: '1 1 0',
			display: 'flex',
			flexDirection: 'column'
		}

		return (
			<div style={rootStyles}>
				{this.props.children}
			</div>
		)
	}
}


