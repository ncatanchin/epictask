import * as React from 'react'
import {Link} from 'react-router'

/**
 * The root container for the app
 */
export class Login extends React.Component<any,any> {

	constructor(props, context) {
		super(props, context)
	}


	render() {

		return (
			<div>
				Login here, <Link to="/repos">Goto Repos</Link>
			</div>
		)
	}
}


