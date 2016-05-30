/**
 * Created by jglanz on 5/30/16.
 */

// Imports
import * as React from 'react'
import {FontIcon} from 'material-ui'

// Constants
const log = getLogger(__filename)

// /**
//  * IMIconProps
//  */
// export interface IMIconProps {
//
// }

/**
 * MIcon
 *
 * @class MIcon
 * @constructor
 **/

export class MIcon extends React.Component<any,any> {

	static getInitialState() {
		return {}
	}

	constructor(props = {}) {
		super(props)
	}

	componentWillMount() {
	}

	componentDidMount() {
	}

	componentWillUnmount() {

	}

	render() {
		const className = (this.props.className || '') + ' ' + 'material-icons'
		return <FontIcon className={className} {...this.props}>
			{this.props.children}
		</FontIcon>
	}

}