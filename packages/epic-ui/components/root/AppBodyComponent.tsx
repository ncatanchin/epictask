import * as React from 'react'



/**
 * The root container for the app
 */
export class AppBody extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	render() {

		return (
			<div>
				<div>body content wrapper</div>
				<div>
					{this.props.children}
				</div>
			</div>
		)
	}
}


